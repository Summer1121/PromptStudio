# Make 工具安装指南（跨平台）

本项目提供了 `Makefile` 和跨平台的 `make.js` 脚本来简化开发流程。

## 🎯 推荐方式：使用 Node.js 脚本（无需安装 make）

最简单的方式是直接使用项目提供的 `make.js` 脚本，无需安装任何额外工具：

```bash
# Windows、macOS、Linux 都支持
node make.js help
node make.js install
node make.js dev
```

或使用 npm 脚本：

```bash
npm run make -- help
npm run make -- install
npm run make -- dev
```

## 📦 安装 make 工具（可选）

如果您想使用标准的 `make` 命令，可以按以下方式安装：

## 方法一：使用 Chocolatey（推荐）

1. **安装 Chocolatey**（如果尚未安装）：
   ```powershell
   # 以管理员身份运行 PowerShell，然后执行：
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **安装 make**：
   ```powershell
   choco install make
   ```

3. **验证安装**：
   ```powershell
   make --version
   ```

## 方法二：使用 Scoop

1. **安装 Scoop**（如果尚未安装）：
   ```powershell
   # 在 PowerShell 中执行：
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **安装 make**：
   ```powershell
   scoop install make
   ```

3. **验证安装**：
   ```powershell
   make --version
   ```

## 方法三：使用 MSYS2/MinGW

1. **下载并安装 MSYS2**：
   - 访问：https://www.msys2.org/
   - 下载并安装 MSYS2

2. **在 MSYS2 终端中安装 make**：
   ```bash
   pacman -S make
   ```

3. **将 MSYS2 的 bin 目录添加到 PATH**：
   - 通常路径为：`C:\msys64\usr\bin`
   - 添加到系统环境变量 PATH 中

## 使用方法

安装 make 后，您可以在项目根目录使用以下命令：

```bash
# 查看所有可用命令
make help

# 安装依赖
make install

# 启动开发服务器
make dev

# 启动 Tauri 桌面应用
make dev-tauri

# 构建生产版本
make build

# 清理构建产物
make clean
```

## 常见问题

### Q: 提示 'make' 不是内部或外部命令
A: 请确保已安装 make 并将其添加到系统 PATH 环境变量中。

### Q: 不想安装 make，有其他选择吗？
A: 可以使用项目提供的 `make.js` Node.js 脚本，功能完全相同，且跨平台兼容。

### Q: 在 Git Bash 中可以使用 make 吗？
A: 可以，Git Bash 通常自带 make。如果提示找不到，请确保 Git Bash 的 bin 目录在 PATH 中。
