import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import mcp_routes
from .services.process_manager import mcp_manager
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="PromptStudio Local MCP Host", version="1.0.0")

# 跨域配置 (Tauri)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(mcp_routes.router, prefix="/api/v1/mcp")

@app.on_event("startup")
async def startup_event():
    logger.info("Local MCP Host Starting...")
    await mcp_manager.start_all_configured()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down MCP processes...")
    await mcp_manager.shutdown()

if __name__ == "__main__":
    # 显式排除 skills 目录（尽管我们已经移到了 home 目录）以防万一
    uvicorn.run("mcp_host.main:app", host="0.0.0.0", port=19880, reload=True, reload_excludes=["skills"])