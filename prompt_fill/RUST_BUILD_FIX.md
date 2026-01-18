# Rust/Tauri 编译问题修复指南

## 问题描述

编译 Rust/Tauri 项目时出现错误：
```
LINK : fatal error LNK1181: cannot open input file 'kernel32.lib'
```

## 原因

Rust 在 Windows 上使用 MSVC 工具链编译时，需要 Windows SDK 的库文件路径。这些路径通过环境变量（`LIB`、`INCLUDE` 等）提供，通常在 Visual Studio 开发者命令提示符中自动设置。

在普通 PowerShell 或 CMD 中运行时，这些环境变量可能未设置，导致链接器找不到 Windows SDK 库文件。

## 解决方案

### 方法一：使用提供的脚本（推荐）

**选项 A：使用 build-tauri.ps1（自动设置环境）**
```powershell
# 开发模式
.\build-tauri.ps1 dev

# 构建模式
.\build-tauri.ps1 build
```

**选项 B：先设置环境，再编译**
```powershell
# 1. 设置环境变量
. .\setup-rust-env.ps1

# 2. 然后正常编译
npm run tauri:dev
# 或
cargo build
```

### 方法二：使用 Visual Studio 开发者命令提示符

1. 打开 "Developer Command Prompt for VS 2022"
2. 导航到项目目录
3. 运行编译命令

### 方法三：安装 Windows SDK（如果未安装）

1. 打开 Visual Studio Installer
2. 修改 Visual Studio 2022 Community
3. 确保已安装：
   - ✅ 使用 C++ 的桌面开发
   - ✅ Windows 10 SDK 或 Windows 11 SDK（最新版本）

### 方法四：手动设置环境变量

在 PowerShell 中运行：
```powershell
# 设置 Visual Studio 路径
$vsPath = "C:\Program Files\Microsoft Visual Studio\2022\Community"

# 调用 vcvars64.bat（这会设置所有必要的环境变量）
& "$vsPath\VC\Auxiliary\Build\vcvars64.bat"
```

注意：这个方法在 PowerShell 中可能不会正确设置环境变量，建议使用方法一或方法二。

## 验证环境变量

设置后，可以检查环境变量是否正确：

```powershell
# 检查 LIB 环境变量（应该包含 Windows SDK 路径）
$env:LIB

# 检查 INCLUDE 环境变量
$env:INCLUDE

# 检查 PATH（应该包含 Visual Studio 工具链）
$env:PATH -split ';' | Select-String -Pattern "Visual Studio|Windows Kits"
```

## 常见问题

### Q: 为什么之前可以编译，现在不行了？

A: 可能是因为：
- 之前在 Visual Studio 开发者命令提示符中运行
- 或者环境变量在之前的会话中已设置，但新会话中丢失了

### Q: 如何永久解决这个问题？

A: 可以：
1. 使用 `build-tauri.ps1` 脚本（推荐）
2. 或者将环境变量设置添加到 PowerShell 配置文件中
3. 或者始终使用 Visual Studio 开发者命令提示符

### Q: 找不到 Windows SDK 怎么办？

A: 需要安装 Windows SDK：
1. 打开 Visual Studio Installer
2. 修改 Visual Studio 2022
3. 在"单个组件"中搜索并安装 "Windows SDK"

## 推荐工作流程

对于日常开发，推荐使用 `build-tauri.ps1` 脚本：

```powershell
# 开发模式（自动设置环境 + 启动开发服务器）
.\build-tauri.ps1 dev

# 构建生产版本
.\build-tauri.ps1 build
```

这样就不需要每次都手动设置环境变量了。
