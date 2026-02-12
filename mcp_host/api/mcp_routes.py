from fastapi import APIRouter, HTTPException, Body, Request
from sse_starlette.sse import EventSourceResponse
try:
    from services.process_manager import mcp_manager
    from services.stdio_client import StdioRpcClient
except ImportError:
    from ..services.process_manager import mcp_manager
    from ..services.stdio_client import StdioRpcClient
from typing import Dict, Any, List
import asyncio
import json
import logging
import os
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)

clients: Dict[str, StdioRpcClient] = {}
clients_lock = asyncio.Lock()

async def get_client(server_name: str) -> StdioRpcClient:
    async with clients_lock:
        # 检查已有 client 是否有效
        existing = clients.get(server_name)
        mcp_proc = mcp_manager.processes.get(server_name)
        
        if existing:
            # 检查 client 运行状态以及底层进程是否依然存活且管道未关闭
            is_alive = (
                existing._is_running and 
                mcp_proc and 
                mcp_proc.process and 
                mcp_proc.process.returncode is None and
                not mcp_proc.process.stdin.is_closing()
            )
            
            if is_alive:
                return existing
            
            # 否则清理掉旧的
            logger.info(f"Client for {server_name} is stale or process died, recreating...")
            await existing.stop()
            if server_name in clients:
                del clients[server_name]

        if not mcp_proc or not mcp_proc.is_running or not mcp_proc.process or mcp_proc.process.returncode is not None:
            # 如果进程没在运行或已退出，尝试根据配置启动
            config = mcp_manager.load_config()
            info = config.get("servers", {}).get(server_name)
            if info:
                await mcp_manager.start_server(server_name, info)
                mcp_proc = mcp_manager.processes.get(server_name)
            
            if not mcp_proc or not mcp_proc.is_running:
                raise HTTPException(status_code=404, detail=f"Server {server_name} not found or failed to start")

        client = StdioRpcClient(mcp_proc)
        await client.start()
        # ... 初始化逻辑保持不变 ...
        try:
            await client.call("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "PromptStudio-Hub", "version": "1.0.0"}
            })
            await client.notify("notifications/initialized")
        except Exception as e:
            pass
        clients[server_name] = client
        return clients[server_name]

# --- Server State Management ---

@router.get("/server/state")
async def get_server_state():
    active_servers = await mcp_manager.get_last_active_servers()
    return {"last_active_servers": active_servers}

@router.get("/servers")
async def list_all_servers():
    config = mcp_manager.load_config()
    server_configs = config.get("servers", {})
    
    # 合并配置中的和当前运行中的（防止配置写入延迟或丢失）
    all_names = set(server_configs.keys()) | set(mcp_manager.processes.keys())
    
    servers = []
    for name in all_names:
        info = server_configs.get(name, {})
        is_running = name in mcp_manager.processes and mcp_manager.processes[name].is_running
        servers.append({
            "name": name,
            "status": "running" if is_running else "stopped",
            "last_status": info.get("last_status"),
            "auto_start": info.get("auto_start", True)
        })
    return {"servers": servers}

@router.post("/server/{name}/start")
async def start_server(name: str):
    config = mcp_manager.load_config()
    info = config.get("servers", {}).get(name)
    if not info:
        raise HTTPException(status_code=404, detail="Server config not found")
    
    await mcp_manager.start_server(name, info)
    return {"status": "started"}

@router.post("/server/{name}/stop")
async def stop_server(name: str):
    try:
        await mcp_manager.stop_server(name)
        # 清理缓存的 client
        async with clients_lock:
            if name in clients:
                await clients[name].stop()
                del clients[name]
        return {"status": "stopped"}
    except Exception as e:
        logger.error(f"Error stopping server {name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/server/{name}")
async def delete_server(name: str):
    """
    从配置中删除服务器（通常用于外部服务器）
    """
    try:
        # 先停止进程
        await mcp_manager.stop_server(name)
        async with clients_lock:
            if name in clients:
                await clients[name].stop()
                del clients[name]
            
        # 从配置中移除
        config = mcp_manager.load_config()
        if name in config.get("servers", {}):
            del config["servers"][name]
            mcp_manager._save_config(config)
            
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Error deleting server {name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# --- REST API Endpoints (Gateway / Frontend) ---

@router.get("/tools")
async def list_tools():
    all_tools = []
    # 确保所有配置的服务都已启动
    await mcp_manager.start_all_configured()
    
    # 使用 list() 包装 keys 以避免 RuntimeError: dictionary changed size during iteration
    server_names = list(mcp_manager.processes.keys())
    logger.info(f"Checking tools for processes: {server_names}")

    for server_name in server_names:
        try:
            client = await get_client(server_name)
            result = await client.call("tools/list", timeout=5.0)
            tools = result.get("tools", [])
            logger.info(f"Server {server_name} returned {len(tools)} tools")
            for tool in tools:
                tool["_server_name"] = server_name
            all_tools.extend(tools)
        except Exception as e:
            logger.error(f"Error listing tools for {server_name}: {e}")
            pass
    return {"tools": all_tools}

@router.post("/tools/{tool_name}/call")
async def call_tool(tool_name: str, payload: Dict[str, Any]):
    """
    前端和 ps-cli 使用的 REST 风格调用接口
    """
    server_name = payload.get("server_name")
    if not server_name:
        raise HTTPException(status_code=400, detail="server_name required")
    
    try:
        client = await get_client(server_name)
        result = await client.call("tools/call", {
            "name": tool_name,
            "arguments": payload.get("arguments", {})
        })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Standard MCP SSE Implementation (Claude Desktop / Gemini CLI) ---

# SSE 连接队列，用于广播通知
sse_queues = []

@router.get("/sse")
async def handle_sse(request: Request):
    """标准的 MCP SSE 端点"""
    queue = asyncio.Queue()
    sse_queues.append(queue)
    
    async def event_generator():
        # 发送初始 endpoint 事件，告诉客户端要把消息 POST 到哪里
        # 使用 request.base_url 获取绝对路径，避免客户端解析相对路径出错
        base_url = str(request.base_url).rstrip("/")
        messages_url = f"{base_url}/api/v1/mcp/messages"
        
        yield {
            "event": "endpoint",
            "data": messages_url
        }
        
        try:
            while True:
                if await request.is_disconnected():
                    break
                message = await queue.get()
                yield {
                    "event": "message",
                    "data": json.dumps(message)
                }
        except asyncio.CancelledError:
            pass
        finally:
            sse_queues.remove(queue)

    return EventSourceResponse(event_generator())

@router.post("/messages")
async def handle_messages(request: Request):
    """处理客户端发来的 JSON-RPC 请求"""
    try:
        message = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    method = message.get("method")
    msg_id = message.get("id")
    
    response = None

    if method == "initialize":
        response = {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": True}
                },
                "serverInfo": {"name": "PromptStudio-Host", "version": "1.0.0"}
            }
        }
    
    elif method == "tools/list":
        # 复用 REST 函数逻辑
        try:
            all_tools_resp = await list_tools()
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": all_tools_resp
            }
        except Exception as e:
             response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32603, "message": str(e)}
            }

    elif method == "tools/call":
        params = message.get("params", {})
        tool_name = params.get("name")
        args = params.get("arguments", {})
        
        # 查找 server
        target_server = None
        try:
            all_tools_resp = await list_tools()
            for t in all_tools_resp["tools"]:
                if t["name"] == tool_name:
                    target_server = t.get("_server_name")
                    break
        except:
            pass
        
        if target_server:
            try:
                client = await get_client(target_server)
                call_result = await client.call("tools/call", {
                    "name": tool_name,
                    "arguments": args
                })
                response = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": call_result
                }
            except Exception as e:
                response = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {"code": -32603, "message": str(e)}
                }
        else:
            response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32601, "message": f"Tool {tool_name} not found"}
            }
            
    elif method == "notifications/initialized":
        pass
    elif method == "ping":
        response = {"jsonrpc": "2.0", "id": msg_id, "result": {}}
    else:
        # 对于不支持的方法，返回 method not found
        if msg_id is not None:
             response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32601, "message": "Method not found"}
            }

    if response:
        for q in sse_queues:
            await q.put(response)
        return response
            
    return {"status": "accepted"}

# --- Skills Management ---

SKILLS_DIR = Path.home() / ".promptstudio" / "skills"
if not SKILLS_DIR.exists():
    SKILLS_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/skills")
async def list_skills():
    skills = []
    if SKILLS_DIR.exists():
        for f in os.listdir(SKILLS_DIR):
            if f.endswith(".py"):
                skills.append({"name": f[:-3], "filename": f})
    return {"skills": skills}

@router.post("/skills")
async def create_skill(
    name: str = Body(...), 
    code: str = Body(...),
    env: Dict[str, str] = Body(None)
):
    filename = f"{name}.py"
    filepath = SKILLS_DIR / filename
    
    # 如果服务已在运行，先停止并清理
    if name in mcp_manager.processes:
        await mcp_manager.stop_server(name)
        async with clients_lock:
            if name in clients:
                await clients[name].stop()
                del clients[name]
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    
    # 自动注册并启动
    await mcp_manager.start_skill(name, str(filepath), env=env)
    return {"status": "created", "name": name}

@router.get("/skills/{name}")
async def get_skill(name: str):
    filepath = SKILLS_DIR / f"{name}.py"
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Skill not found")
    with open(filepath, "r", encoding="utf-8") as f:
        return {"name": name, "code": f.read()}

@router.delete("/skills/{name}")
async def delete_skill(name: str):
    filepath = SKILLS_DIR / f"{name}.py"
    if filepath.exists():
        os.remove(filepath)
    await mcp_manager.stop_server(name)
    return {"status": "deleted"}