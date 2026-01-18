# PowerShell 环境设置脚本
# 运行此脚本可以将 make 函数添加到您的 PowerShell 配置文件中

$profilePath = $PROFILE.CurrentUserAllHosts
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$makeScriptPath = Join-Path $scriptDir "make.ps1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PowerShell Make 命令设置" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 PowerShell 配置文件是否存在
if (-not (Test-Path $profilePath)) {
    Write-Host "📝 创建 PowerShell 配置文件..." -ForegroundColor Yellow
    $profileDir = Split-Path -Parent $profilePath
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
    Write-Host "✅ 配置文件已创建: $profilePath" -ForegroundColor Green
}

# 检查是否已经添加过
$profileContent = Get-Content $profilePath -ErrorAction SilentlyContinue
$makeFunctionPattern = "function make"

if ($profileContent -match $makeFunctionPattern) {
    Write-Host "⚠️  检测到配置文件中已存在 make 函数" -ForegroundColor Yellow
    $response = Read-Host "是否要更新？(Y/N)"
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "已取消操作" -ForegroundColor Gray
        exit 0
    }
    # 移除旧的 make 函数定义
    $newContent = $profileContent | Where-Object { $_ -notmatch $makeFunctionPattern -and $_ -notmatch "Export-ModuleMember.*make" }
    $newContent | Set-Content $profilePath
}

# 添加 make 函数到配置文件
Write-Host "📝 添加 make 函数到 PowerShell 配置文件..." -ForegroundColor Yellow

$makeFunctionCode = @"

# Make 命令函数 - 由 Prompt Fill 项目添加
function make {
    param(
        [Parameter(Position=0)]
        [string]`$Command = "help"
    )
    
    # 切换到项目目录
    `$scriptDir = "$scriptDir"
    if (Test-Path "`$scriptDir\make.js") {
        Set-Location `$scriptDir
        node make.js `$Command
    } else {
        Write-Host "❌ 找不到 make.js 文件" -ForegroundColor Red
    }
}

"@

Add-Content -Path $profilePath -Value $makeFunctionCode
Write-Host "✅ make 函数已添加到配置文件" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  设置完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "现在您可以：" -ForegroundColor Yellow
Write-Host "  1. 重新打开 PowerShell 窗口，或" -ForegroundColor Gray
Write-Host "  2. 运行: . `$PROFILE 来重新加载配置" -ForegroundColor Gray
Write-Host ""
Write-Host "然后就可以使用 make 命令了：" -ForegroundColor Yellow
Write-Host "  make help      # 查看帮助" -ForegroundColor Gray
Write-Host "  make install   # 安装依赖" -ForegroundColor Gray
Write-Host "  make dev       # 启动开发服务器" -ForegroundColor Gray
Write-Host ""
