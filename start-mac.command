#!/bin/bash

# 视频号发布助手 - Mac 启动脚本
# 双击运行此脚本即可启动本地服务

echo "======================================"
echo "   视频号发布助手 - 启动中..."
echo "======================================"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/local-server"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    echo ""
    read -p "按 Enter 键退出..."
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
    echo ""
fi

# 启动服务
echo "正在启动本地服务..."
echo ""
echo "======================================"
echo "   服务启动成功！"
echo "======================================"
echo ""
echo "📋 使用说明："
echo "   1. 在 Chrome 中加载扩展: chrome://extensions/"
echo "   2. 开启「开发者模式」"
echo "   3. 点击「加载已解压的扩展程序」"
echo "   4. 选择 chrome-extension 文件夹"
echo ""
echo "🌐 访问地址："
echo "   发布历史: http://localhost:3000/"
echo ""
echo "⚠️  请勿关闭此窗口，关闭将停止服务"
echo "======================================"
echo ""

# 启动服务器
node server.js
