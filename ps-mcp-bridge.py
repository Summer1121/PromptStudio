import sys
import json
import requests
import logging

# 配置日志到 stderr，因为 stdout 被 MCP 协议占用了
logging.basicConfig(level=logging.DEBUG, stream=sys.stderr)
logger = logging.getLogger("ps-bridge")

BASE_URL = "http://localhost:19880/api/v1/mcp"

def rpc_response(id, result):
    print(json.dumps({"jsonrpc": "2.0", "id": id, "result": result}))
    sys.stdout.flush()

def rpc_error(id, code, message):
    print(json.dumps({"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}}))
    sys.stdout.flush()

def handle_list_tools(msg_id):
    try:
        res = requests.get(f"{BASE_URL}/tools")
        res.raise_for_status()
        tools = res.json().get("tools", [])
        # 清理内部字段
        clean_tools = []
        for t in tools:
            t_copy = t.copy()
            if "_server_name" in t_copy:
                del t_copy["_server_name"]
            clean_tools.append(t_copy)
            
        rpc_response(msg_id, {"tools": clean_tools})
    except Exception as e:
        logger.error(f"List tools failed: {e}")
        rpc_error(msg_id, -32603, str(e))

def handle_call_tool(msg_id, params):
    name = params.get("name")
    args = params.get("arguments", {})
    
    try:
        # 先查 server
        res = requests.get(f"{BASE_URL}/tools")
        tools = res.json().get("tools", [])
        target = next((t for t in tools if t['name'] == name), None)
        if not target:
            rpc_error(msg_id, -32601, f"Tool {name} not found")
            return

        server_name = target.get("_server_name")
        
        # 调用
        call_res = requests.post(f"{BASE_URL}/tools/{name}/call", json={
            "server_name": server_name,
            "arguments": args
        })
        call_res.raise_for_status()
        
        rpc_response(msg_id, call_res.json())
        
    except Exception as e:
        logger.error(f"Call tool failed: {e}")
        rpc_error(msg_id, -32603, str(e))

def main():
    logger.info("PromptStudio MCP Bridge Started")
    
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            msg = json.loads(line)
            method = msg.get("method")
            msg_id = msg.get("id")
            
            if method == "initialize":
                rpc_response(msg_id, {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": True}
                    },
                    "serverInfo": {"name": "PromptStudio-Bridge", "version": "1.0.0"}
                })
            elif method == "notifications/initialized":
                pass # No response needed
            elif method == "tools/list":
                handle_list_tools(msg_id)
            elif method == "tools/call":
                handle_call_tool(msg_id, msg.get("params"))
            else:
                # 忽略其他请求 (如 ping)
                pass
                
        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.error(f"Loop error: {e}")

if __name__ == "__main__":
    main()
