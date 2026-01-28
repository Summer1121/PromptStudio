import asyncio
import json
import logging
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional
import time

logger = logging.getLogger(__name__)

class McpProcess:
    """封装单个 MCP 服务器进程及其通信管道 (异步版)"""
    def __init__(self, name: str, command: str, args: List[str], cwd: Optional[str] = None, env: Optional[Dict[str, str]] = None):
        self.name = name
        self.command = command
        self.args = args
        self.cwd = cwd
        self.env = env
        self.process: Optional[asyncio.subprocess.Process] = None
        self.is_running = False

    async def start(self):
        try:
            full_command = [self.command] + self.args
            logger.info(f"正在启动 MCP 服务器 [{self.name}]: {' '.join(full_command)}")
            
            # Combine system env with custom env
            process_env = os.environ.copy()
            if self.env:
                process_env.update(self.env)

            self.process = await asyncio.create_subprocess_exec(
                self.command, *self.args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.cwd,
                env=process_env
            )
            self.is_running = True
            logger.info(f"MCP 服务器 [{self.name}] 已启动，PID: {self.process.pid}")
        except Exception as e:
            logger.error(f"启动 MCP 服务器 [{self.name}] 失败: {e}")
            self.is_running = False
            raise

    async def stop(self):
        if self.process:
            logger.info(f"正在停止 MCP 服务器 [{self.name}]")
            try:
                self.process.terminate()
                await asyncio.wait_for(self.process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                self.process.kill()
            self.is_running = False
            logger.info(f"MCP 服务器 [{self.name}] 已停止")

class McpProcessManager:
    """管理所有本地 MCP 服务器进程的单例类"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(McpProcessManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.processes: Dict[str, McpProcess] = {}
        self.config_path = Path.home() / ".promptstudio" / "mcp_config.json"
        self.uv_path = self._find_uv()
        self._initialized = True
        self._ensure_config_dir()

    def _find_uv(self) -> str:
        """查找系统中的 uv 可执行文件"""
        path = shutil.which("uv")
        if path:
            logger.info(f"找到 uv: {path}")
            return path
        logger.warning("未找到 uv，将回退到标准 python 运行器")
        return sys.executable

    def _ensure_config_dir(self):
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.config_path.exists():
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump({"servers": {}}, f, indent=2)

    def load_config(self) -> dict:
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"读取 MCP 配置文件失败: {e}")
            return {"servers": {}}

    def _save_config(self, config: dict):
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")

    async def start_all_configured(self):
        # 新逻辑：不再自动启动，而是由前端决定恢复
        # 这里只加载配置，不执行操作
        pass

    async def get_last_active_servers(self) -> List[str]:
        config = self.load_config()
        active = []
        for name, info in config.get("servers", {}).items():
            if info.get("last_status") == "running":
                active.append(name)
        return active

    async def start_server(self, name: str, info: dict):
        # 更新配置中的状态
        config = self.load_config()
        if name not in config.get("servers", {}):
            config.setdefault("servers", {})[name] = info
        
        config["servers"][name]["last_status"] = "running"
        # 更新 info 以防参数变化
        config["servers"][name]["command"] = info.get("command")
        config["servers"][name]["args"] = info.get("args")
        # Ensure env is saved
        config["servers"][name]["env"] = info.get("env")
        
        self._save_config(config)

        if name in self.processes and self.processes[name].is_running:
            logger.warning(f"MCP 服务器 [{name}] 已经在运行中")
            return

        command = info.get("command")
        args = info.get("args", [])
        cwd = info.get("cwd")
        env = info.get("env")

        if not command:
            logger.error(f"服务器 [{name}] 配置缺失 command 项")
            return

        mcp_proc = McpProcess(name, command, args, cwd, env=env)
        try:
            await mcp_proc.start()
            self.processes[name] = mcp_proc
        except Exception:
            pass

    async def start_skill(self, name: str, script_path: str, env: Optional[Dict[str, str]] = None):
        """以 MCP 服务器形式启动一个本地 Python 脚本 (Skill)"""
        runner_path = os.path.join(os.path.dirname(__file__), "script_runner.py")
        
        # 优先使用 uv run 来运行脚本，支持 PEP 723 依赖自动管理
        if self.uv_path and "uv" in self.uv_path:
            command = self.uv_path
            args = ["run", runner_path, script_path]
        else:
            command = sys.executable
            args = [runner_path, script_path]
            
        info = {
            "command": command,
            "args": args,
            "auto_start": True,
            "last_status": "running",
            "env": env
        }
        await self.start_server(name, info)

    async def stop_server(self, name: str):
        # 更新配置状态
        config = self.load_config()
        if name in config.get("servers", {}):
            config["servers"][name]["last_status"] = "stopped"
            self._save_config(config)

        if name in self.processes:
            await self.processes[name].stop()
            del self.processes[name]

    async def shutdown(self):
        tasks = []
        for name in list(self.processes.keys()):
            tasks.append(self.stop_server(name))
        await asyncio.gather(*tasks)

# 全局单例
mcp_manager = McpProcessManager()
