import json
import asyncio
import logging
from typing import Dict, Any, Optional
from .process_manager import McpProcess

logger = logging.getLogger(__name__)

class StdioRpcClient:
    """处理与 MCP 服务器的 JSON-RPC stdio 通信 (Async) """
    def __init__(self, mcp_process: McpProcess):
        self.mcp_process = mcp_process
        self.request_id = 0
        self.pending_requests: Dict[int, asyncio.Future] = {}
        self._is_running = False

    async def start(self):
        if not self.mcp_process.process:
            raise RuntimeError(f"服务器 [{self.mcp_process.name}] 进程未启动")
        if self._is_running:
            return
        self._is_running = True
        self._read_task = asyncio.create_task(self._read_loop())

    async def stop(self):
        """停止客户端并清理任务"""
        self._is_running = False
        if hasattr(self, '_read_task'):
            self._read_task.cancel()
            try:
                await self._read_task
            except asyncio.CancelledError:
                pass
        
        # 清理待处理的请求
        for future in self.pending_requests.values():
            if not future.done():
                future.set_exception(Exception("Client stopped"))
        self.pending_requests.clear()

    async def _read_loop(self):
        """循环读取 stdout 中的 JSON-RPC 消息"""
        stdout = self.mcp_process.process.stdout
        try:
            while self._is_running:
                line = await stdout.readline()
                if not line:
                    break
                
                clean_line = line.decode('utf-8').strip()
                if not clean_line:
                    continue

                try:
                    message = json.loads(clean_line)
                    self._handle_message(message)
                except json.JSONDecodeError:
                    logger.debug(f"[{self.mcp_process.name}] 非 JSON 输出: {clean_line}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[{self.mcp_process.name}] Read loop error: {e}")
        finally:
            self._is_running = False

    def _handle_message(self, message: Dict[str, Any]):
        msg_id = message.get("id")
        if msg_id is not None:
            # 响应
            if msg_id in self.pending_requests:
                future = self.pending_requests[msg_id]
                if not future.done():
                    if "error" in message:
                        error_obj = message["error"]
                        # 提取更详细的错误信息，包括 data 字段（通常包含堆栈）
                        if isinstance(error_obj, dict):
                            msg = error_obj.get("message", "")
                            data = error_obj.get("data", "")
                            error_msg = f"{msg} {data}".strip() or json.dumps(error_obj)
                        else:
                            error_msg = str(error_obj)
                        future.set_exception(Exception(error_msg))
                    else:
                        future.set_result(message.get("result"))
        else:
            # 通知 (暂时忽略)
            pass

    async def call(self, method: str, params: Optional[Dict[str, Any]] = None, timeout: float = 10.0) -> Any:
        self.request_id += 1
        current_id = self.request_id
        
        future = asyncio.Future()
        self.pending_requests[current_id] = future
        
        request = {
            "jsonrpc": "2.0",
            "id": current_id,
            "method": method,
            "params": params or {}
        }
        
        try:
            payload = json.dumps(request) + "\n"
            self.mcp_process.process.stdin.write(payload.encode('utf-8'))
            await self.mcp_process.process.stdin.drain()
            
            return await asyncio.wait_for(future, timeout=timeout)
        finally:
            self.pending_requests.pop(current_id, None)
    
    async def notify(self, method: str, params: Optional[Dict[str, Any]] = None):
        """发送通知 (无需等待响应)"""
        notification = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {}
        }
        payload = json.dumps(notification) + "\n"
        self.mcp_process.process.stdin.write(payload.encode('utf-8'))
        await self.mcp_process.process.stdin.drain()

