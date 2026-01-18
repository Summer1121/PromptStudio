# Rust/Tauri 编译环境设置脚本
# 用于设置 Windows SDK 和 Visual Studio 工具链的环境变量

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Rust/Tauri 编译环境设置" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Visual Studio 2022 路径
$vsPath = "C:\Program Files\Microsoft Visual Studio\2022\Community"
$vcvarsPath = "$vsPath\VC\Auxiliary\Build\vcvars64.bat"

# 检查 Visual Studio 是否存在
if (-not (Test-Path $vcvarsPath)) {
    Write-Host "❌ 未找到 Visual Studio 2022 Community" -ForegroundColor Red
    Write-Host "   路径: $vcvarsPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "请确保已安装 Visual Studio 2022 Community 并包含 C++ 工作负载" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 找到 Visual Studio 2022" -ForegroundColor Green

# 查找 Windows SDK
$sdkPaths = @(
    "C:\Program Files (x86)\Windows Kits\10\Lib",
    "C:\Program Files\Windows Kits\10\Lib"
)

$sdkPath = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        break
    }
}

if (-not $sdkPath) {
    Write-Host "⚠️  未找到 Windows SDK" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请安装 Windows SDK：" -ForegroundColor Yellow
    Write-Host "  1. 打开 Visual Studio Installer" -ForegroundColor Gray
    Write-Host "  2. 修改 Visual Studio 2022 Community" -ForegroundColor Gray
    Write-Host "  3. 确保已安装 'Windows 10 SDK' 或 'Windows 11 SDK'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ 找到 Windows SDK: $sdkPath" -ForegroundColor Green
    
    # 获取最新的 SDK 版本
    $sdkVersions = Get-ChildItem $sdkPath -Directory | Sort-Object Name -Descending
    if ($sdkVersions) {
        $latestSdk = $sdkVersions[0].Name
        Write-Host "   最新版本: $latestSdk" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  环境变量设置" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 方法：使用 vcvars64.bat 的输出
Write-Host "正在设置环境变量..." -ForegroundColor Yellow

# 创建一个临时批处理文件来获取环境变量
$tempBat = [System.IO.Path]::GetTempFileName() + ".bat"
$tempPs1 = [System.IO.Path]::GetTempFileName() + ".ps1"

# 创建批处理文件来调用 vcvars64.bat 并导出环境变量
@"
@echo off
call "$vcvarsPath" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to initialize Visual Studio environment
    exit /b 1
)
set > "$tempPs1"
"@ | Out-File -FilePath $tempBat -Encoding ASCII

# 执行批处理文件
& cmd /c $tempBat

if ($LASTEXITCODE -eq 0) {
    # 读取环境变量
    $envVars = Get-Content $tempPs1 | Where-Object { $_ -match '^[A-Z_]+=' }
    
    foreach ($line in $envVars) {
        if ($line -match '^([A-Z_]+)=(.*)$') {
            $varName = $matches[1]
            $varValue = $matches[2]
            [Environment]::SetEnvironmentVariable($varName, $varValue, "Process")
        }
    }
    
    Write-Host "✅ 环境变量已设置" -ForegroundColor Green
    Write-Host ""
    Write-Host "当前环境变量：" -ForegroundColor Yellow
    Write-Host "  LIB: $env:LIB" -ForegroundColor Gray
    Write-Host "  INCLUDE: $env:INCLUDE" -ForegroundColor Gray
    Write-Host ""
    Write-Host "现在可以编译 Rust 项目了：" -ForegroundColor Green
    Write-Host "  cargo build" -ForegroundColor Cyan
    Write-Host "  或" -ForegroundColor Gray
    Write-Host "  npm run tauri:dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ 无法设置环境变量" -ForegroundColor Red
    Write-Host ""
    Write-Host "建议：" -ForegroundColor Yellow
    Write-Host "  1. 使用 Visual Studio 开发者命令提示符" -ForegroundColor Gray
    Write-Host "  2. 或手动安装 Windows SDK" -ForegroundColor Gray
}

# 清理临时文件
Remove-Item $tempBat -ErrorAction SilentlyContinue
Remove-Item $tempPs1 -ErrorAction SilentlyContinue
