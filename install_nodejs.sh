#!/bin/bash

echo "📦 黑洞模拟器 - Node.js安装脚本"
echo "================================"

# 检查系统类型
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ 检测到macOS系统"
    
    # 检查架构
    if [[ $(uname -m) == "x86_64" ]]; then
        ARCH="x64"
        echo "   架构: Intel (x64)"
    elif [[ $(uname -m) == "arm64" ]]; then
        ARCH="arm64"
        echo "   架构: Apple Silicon (arm64)"
    else
        echo "❌ 不支持的架构: $(uname -m)"
        exit 1
    fi
    
    # 下载Node.js
    NODE_VERSION="18.18.0"
    DOWNLOAD_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-${ARCH}.tar.gz"
    
    echo "📥 正在下载Node.js ${NODE_VERSION}..."
    echo "   下载地址: $DOWNLOAD_URL"
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # 下载
    curl -L "$DOWNLOAD_URL" -o nodejs.tar.gz
    
    if [ $? -eq 0 ]; then
        echo "✅ 下载完成"
        
        # 解压
        echo "📂 正在解压..."
        tar -xzf nodejs.tar.gz
        
        # 移动到系统路径
        echo "🔧 正在安装..."
        sudo mv "node-v${NODE_VERSION}-darwin-${ARCH}" /usr/local/nodejs
        sudo ln -sf /usr/local/nodejs/bin/node /usr/local/bin/node
        sudo ln -sf /usr/local/nodejs/bin/npm /usr/local/bin/npm
        sudo ln -sf /usr/local/nodejs/bin/npx /usr/local/bin/npx
        
        # 设置权限
        sudo chmod +x /usr/local/bin/node
        sudo chmod +x /usr/local/bin/npm
        sudo chmod +x /usr/local/bin/npx
        
        # 清理临时文件
        cd -
        rm -rf "$TEMP_DIR"
        
        echo "✅ Node.js安装成功！"
        echo ""
        echo "📋 验证安装："
        echo "   node --version"
        echo "   npm --version"
        echo ""
        echo "🚀 现在可以运行Vercel部署了："
        echo "   python3 deploy_to_cloud.py"
        
    else
        echo "❌ 下载失败"
        exit 1
    fi
    
else
    echo "❌ 不支持的系统类型: $OSTYPE"
    exit 1
fi
