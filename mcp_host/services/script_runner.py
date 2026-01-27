import sys
import os
import importlib.util
from fastmcp import FastMCP

def run_skill(script_path: str):
    """
    加载指定的 Python 脚本并使用 FastMCP 运行
    """
    if not os.path.exists(script_path):
        print(f"Error: 脚本不存在 {script_path}", file=sys.stderr)
        sys.exit(1)

    skill_name = os.path.basename(script_path).replace(".py", "")
    mcp = FastMCP(skill_name)

    try:
        # 动态加载模块
        spec = importlib.util.spec_from_file_location("user_skill", script_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # 扫描模块中的函数，如果有特定装饰器或者特定名称则注册
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if callable(attr) and not attr_name.startswith("_") and attr.__module__ == "user_skill":
                mcp.tool()(attr)

        logger_info = f"已从 {script_path} 加载并注册工具"
        print(logger_info, file=sys.stderr)
        
        mcp.run()
    except Exception as e:
        print(f"运行 Skill 失败: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script_runner.py <path_to_script>", file=sys.stderr)
        sys.exit(1)
    
    run_skill(sys.argv[1])
