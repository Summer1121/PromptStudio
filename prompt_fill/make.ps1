# PowerShell 函数：让 make 命令在 PowerShell 中可用
# 使用方法：在 PowerShell 中执行 . .\make.ps1 来加载函数，然后就可以使用 make 命令了

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function make {
    param(
        [Parameter(Position=0)]
        [string]$Command = "help"
    )
    
    # 切换到脚本所在目录
    Push-Location $scriptDir
    
    try {
        # 调用 Node.js 脚本
        node make.js $Command
    } finally {
        # 恢复原来的目录
        Pop-Location
    }
}

# 将函数添加到当前作用域
Set-Item -Path "Function:global:make" -Value $function:make

Write-Host "✅ make 函数已加载！现在可以使用 make 命令了。" -ForegroundColor Green
Write-Host ""
Write-Host "示例：" -ForegroundColor Yellow
Write-Host "  make help      # 查看帮助" -ForegroundColor Gray
Write-Host "  make install   # 安装依赖" -ForegroundColor Gray
Write-Host "  make dev       # 启动开发服务器" -ForegroundColor Gray
Write-Host ""
