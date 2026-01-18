# Makefile for Prompt Fill (Tauri + Vite + React)
# 跨平台支持：Windows、macOS、Linux
# 
# 如果系统已安装 make，可以直接使用 make 命令
# 如果没有安装 make，可以使用: node make.js <command> 或 npm run make -- <command>

.PHONY: help install dev dev-web dev-tauri build build-tauri clean lint test preview

# 默认目标：显示帮助信息
help:
	@node make.js help

# 安装依赖
install:
	@node make.js install

# Web 开发服务器（自动打开浏览器）
dev:
	@node make.js dev

# Web 开发服务器（不自动打开）
dev-web:
	@node make.js dev-web

# Tauri 桌面应用开发模式
dev-tauri:
	@node make.js dev-tauri

# 构建生产版本（Web）
build:
	@node make.js build

# 构建 Tauri 桌面应用
build-tauri:
	@node make.js build-tauri

# 清理构建产物
clean:
	@node make.js clean

# 代码检查
lint:
	@node make.js lint

# E2E 测试
test:
	@node make.js test

# 预览生产构建
preview:
	@node make.js preview
