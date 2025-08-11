#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
黑洞模拟器公网访问启动脚本
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def check_ngrok():
    """检查ngrok是否已安装"""
    try:
        result = subprocess.run(['ngrok', 'version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def install_ngrok():
    """安装ngrok"""
    print("📦 正在安装ngrok...")
    try:
        subprocess.run(['brew', 'install', 'ngrok'], check=True)
        print("✅ ngrok安装成功！")
        return True
    except subprocess.CalledProcessError:
        print("❌ 安装失败，请手动安装：")
        print("   1. 访问 https://ngrok.com/download")
        print("   2. 下载并安装ngrok")
        print("   3. 注册账号获取authtoken")
        return False

def start_public_server():
    """启动公网访问服务"""
    print("🌐 黑洞模拟器 - 公网访问")
    print("="*40)
    
    # 检查ngrok
    if not check_ngrok():
        print("❌ 未检测到ngrok")
        choice = input("是否自动安装ngrok？(y/n): ")
        if choice.lower() == 'y':
            if not install_ngrok():
                return
        else:
            print("请手动安装ngrok后重试")
            return
    
    # 启动本地服务器
    print("🚀 启动本地服务器...")
    server_process = subprocess.Popen([sys.executable, 'start_server.py'])
    
    # 等待服务器启动
    time.sleep(3)
    
    print("🌍 启动ngrok隧道...")
    print("💡 获得公网地址后，任何人都可以访问您的网站！")
    print("="*50)
    
    try:
        # 启动ngrok
        subprocess.run(['ngrok', 'http', '8000'])
    except KeyboardInterrupt:
        print("\n🛑 正在停止服务...")
    finally:
        # 停止本地服务器
        server_process.terminate()
        server_process.wait()
        print("✅ 服务已停止")

if __name__ == "__main__":
    start_public_server()
