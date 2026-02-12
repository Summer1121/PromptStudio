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

        import inspect

        # 扫描模块中的函数，只注册真正的函数，跳过类
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            
            # 必须是可调用的，且不是私有的，且定义在该模块中
            if callable(attr) and not attr_name.startswith("_") and getattr(attr, "__module__", "") == "user_skill":
                # 排除类，只接受函数
                if inspect.isfunction(attr):
                    # 如果已经有 mcp 实例注册过了，FastMCP 会处理
                    # 这里我们统一注册到 runner 创建的 mcp 实例上
                    mcp.tool()(attr)
                    print(f"已注册工具: {attr_name}", file=sys.stderr)

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
