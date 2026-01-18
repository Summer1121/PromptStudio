# PowerShell 中使用 make 命令指南

在 Windows PowerShell 中，您可以通过以下方式使用 `make` 命令：

## 方法一：临时加载（当前会话）

在 PowerShell 中进入项目目录，然后运行：

```powershell
cd d:\pythonProject\PromptStudio\prompt_fill
. .\make.ps1
```

然后就可以使用 `make` 命令了：

```powershell
make help      # 查看帮助
make install   # 安装依赖
make dev       # 启动开发服务器
```

**注意**：这种方式只在当前 PowerShell 会话中有效，关闭窗口后需要重新加载。

## 方法二：永久设置（推荐）

运行设置脚本，将 `make` 函数添加到您的 PowerShell 配置文件中：

```powershell
cd d:\pythonProject\PromptStudio\prompt_fill
.\setup-powershell.ps1
```

设置完成后：
1. 重新打开 PowerShell 窗口，或
2. 运行 `. $PROFILE` 重新加载配置

之后就可以在任何地方使用 `make` 命令了！

## 方法三：直接使用 Node.js 脚本（无需设置）

如果不想设置 PowerShell 函数，可以直接使用：

```powershell
node make.js help
node make.js install
node make.js dev
```

或使用 npm 脚本：

```powershell
npm run make -- help
npm run make -- install
npm run make -- dev
```

## 方法四：安装 make 工具

如果您希望使用标准的 `make` 命令，可以安装 make 工具：

```powershell
# 使用 Chocolatey
choco install make

# 或使用 Scoop
scoop install make
```

安装后就可以直接使用 `make` 命令了。

## 故障排除

### 问题：执行 `. .\make.ps1` 后仍然提示找不到 make 命令

**解决方案**：
1. 确保您在项目根目录中
2. 检查 `make.ps1` 文件是否存在
3. 尝试使用完整路径：`. .\make.ps1`（注意有两个点）

### 问题：PowerShell 执行策略限制

如果遇到执行策略错误，可以临时允许脚本执行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

### 问题：setup-powershell.ps1 无法修改配置文件

**解决方案**：
1. 以管理员身份运行 PowerShell
2. 或手动编辑 PowerShell 配置文件：`notepad $PROFILE`
3. 添加以下内容：

```powershell
function make {
    param([string]$Command = "help")
    $scriptDir = "d:\pythonProject\PromptStudio\prompt_fill"
    if (Test-Path "$scriptDir\make.js") {
        Push-Location $scriptDir
        try {
            node make.js $Command
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "❌ 找不到 make.js 文件" -ForegroundColor Red
    }
}
```

## 推荐方案

对于大多数用户，推荐使用**方法二（永久设置）**，这样设置一次后就可以在任何地方使用 `make` 命令了。
