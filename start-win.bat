@echo off
chcp 65001 >nul
title 视频号发布助手

echo ======================================
echo    视频号发布助手 - 启动中...
echo ======================================
echo.

:: 获取脚本所在目录
cd /d "%~dp0local-server"

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js 版本: %NODE_VERSION%
echo.

:: 检查依赖是否安装
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    echo.
)

:: 启动服务
echo 正在启动本地服务...
echo.
echo ======================================
echo    服务启动成功！
echo ======================================
echo.
echo 📋 使用说明：
echo    1. 在 Chrome 中加载扩展: chrome://extensions/
echo    2. 开启「开发者模式」
echo    3. 点击「加载已解压的扩展程序」
echo    4. 选择 chrome-extension 文件夹
echo.
echo 🌐 访问地址：
echo    发布历史: http://localhost:3000/
echo.
echo ⚠️  请勿关闭此窗口，关闭将停止服务
echo ======================================
echo.

:: 启动服务器
node server.js

pause
