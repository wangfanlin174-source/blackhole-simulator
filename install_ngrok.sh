#!/bin/bash

echo "🚀 黑洞模拟器 - ngrok安装脚本"
echo "=================================="

# 检查系统类型
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ 检测到macOS系统"
    PLATFORM="darwin"
else
    echo "❌ 不支持的系统类型: $OSTYPE"
    exit 1
fi

# 检查架构
if [[ $(uname -m) == "x86_64" ]]; then
    ARCH="amd64"
elif [[ $(uname -m) == "arm64" ]]; then
    ARCH="arm64"
else
    echo "❌ 不支持的架构: $(uname -m)"
    exit 1
fi

echo "📦 正在下载ngrok..."
echo "   平台: $PLATFORM"
echo "   架构: $ARCH"

# 下载ngrok
DOWNLOAD_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-$PLATFORM-$ARCH.tgz"
TEMP_DIR=$(mktemp -d)

cd "$TEMP_DIR"
curl -L "$DOWNLOAD_URL" -o ngrok.tgz

if [ $? -eq 0 ]; then
    echo "✅ 下载完成"
    
    # 解压
    echo "📂 正在解压..."
    tar -xzf ngrok.tgz
    
    # 移动到系统路径
    echo "🔧 正在安装..."
    sudo mv ngrok /usr/local/bin/
    
    # 设置权限
    sudo chmod +x /usr/local/bin/ngrok
    
    # 清理临时文件
    cd -
    rm -rf "$TEMP_DIR"
    
    echo "✅ ngrok安装成功！"
    echo ""
    echo "📋 下一步配置："
    echo "1. 访问 https://ngrok.com/ 注册账号"
    echo "2. 在dashboard中获取authtoken"
    echo "3. 运行: ngrok config add-authtoken YOUR_TOKEN"
    echo "4. 启动公网服务: python3 start_public.py"
    
else
    echo "❌ 下载失败"
    exit 1
fi
