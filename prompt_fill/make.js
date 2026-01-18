#!/usr/bin/env node
/**
 * 跨平台的 make 替代脚本
 * 兼容 Windows、macOS 和 Linux
 * 
 * 使用方法：
 *   node make.js <command>
 *   或
 *   npm run make -- <command>
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 切换到脚本所在目录
process.chdir(__dirname);

const commands = {
  help: {
    description: '显示此帮助信息',
    action: showHelp
  },
  install: {
    description: '安装项目依赖',
    action: () => runCommand('npm install', '📦 正在安装依赖...')
  },
  dev: {
    description: '启动 Web 开发服务器（自动打开浏览器）',
    action: () => runCommand('npm run dev:open', '🚀 启动 Web 开发服务器...')
  },
  'dev-web': {
    description: '启动 Web 开发服务器（不自动打开）',
    action: () => runCommand('npm run dev', '🚀 启动 Web 开发服务器...')
  },
  'dev-tauri': {
    description: '启动 Tauri 桌面应用开发模式',
    action: () => runCommand('npm run tauri:dev', '🚀 启动 Tauri 桌面应用开发模式...')
  },
  build: {
    description: '构建生产版本',
    action: () => runCommand('npm run build', '🔨 构建生产版本...')
  },
  'build-tauri': {
    description: '构建 Tauri 桌面应用',
    action: () => runCommand('npx tauri build', '🔨 构建 Tauri 桌面应用...')
  },
  clean: {
    description: '清理构建产物和缓存',
    action: cleanBuild
  },
  lint: {
    description: '运行 ESLint 代码检查',
    action: () => runCommand('npm run lint', '🔍 运行代码检查...')
  },
  test: {
    description: '运行 E2E 测试',
    action: () => runCommand('npm run test:e2e', '🧪 运行 E2E 测试...')
  },
  preview: {
    description: '预览生产构建',
    action: () => runCommand('npm run preview', '👀 预览生产构建...')
  }
};

function showHelp() {
  console.log('==========================================');
  console.log('  Prompt Fill 项目 Makefile 命令');
  console.log('==========================================');
  console.log('');
  console.log('可用命令：');
  
  for (const [cmd, info] of Object.entries(commands)) {
    const padding = ' '.repeat(Math.max(0, 20 - cmd.length));
    console.log(`  ${cmd}${padding} - ${info.description}`);
  }
  console.log('');
  console.log('使用方法：');
  console.log('  node make.js <command>');
  console.log('  或');
  console.log('  npm run make -- <command>');
  console.log('  或');
  console.log('  make <command>  (如果已安装 make)');
  console.log('');
}

function runCommand(command, message) {
  if (message) {
    console.log(message);
  }
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ 命令执行失败: ${command}`);
    process.exit(1);
  }
}

function cleanBuild() {
  console.log('🧹 清理构建产物...');
  
  const pathsToClean = [
    'dist',
    'src-tauri/target',
    'node_modules/.vite'
  ];
  
  let cleaned = false;
  for (const path of pathsToClean) {
    const fullPath = join(__dirname, path);
    if (existsSync(fullPath)) {
      try {
        rmSync(fullPath, { recursive: true, force: true });
        console.log(`  ✓ 已删除: ${path}`);
        cleaned = true;
      } catch (error) {
        console.error(`  ✗ 删除失败: ${path} - ${error.message}`);
      }
    }
  }
  
  if (cleaned) {
    console.log('✅ 清理完成');
  } else {
    console.log('ℹ️  没有需要清理的文件');
  }
}

// 主函数
function main() {
  const command = process.argv[2] || 'help';
  
  if (commands[command]) {
    commands[command].action();
  } else {
    console.error(`❌ 未知命令: ${command}`);
    console.log('');
    showHelp();
    process.exit(1);
  }
}

main();
