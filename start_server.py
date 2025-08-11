#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
黑洞模拟器本地服务器启动脚本
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import socket
from pathlib import Path

def get_local_ip():
    """获取本机局域网IP地址"""
    try:
        # 创建一个UDP连接来获取本机IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "未知"

def start_server(port=8000):
    """启动本地HTTP服务器"""
    
    # 切换到脚本所在目录
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 检查必要文件是否存在
    required_files = ['index.html', 'styles.css', 'script.js']
    missing_files = [f for f in required_files if not Path(f).exists()]
    
    if missing_files:
        print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
        print("请确保所有文件都在同一目录下")
        return False
    
    # 创建HTTP服务器
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        # 监听所有网络接口，允许局域网访问
        with socketserver.TCPServer(("0.0.0.0", port), Handler) as httpd:
            local_ip = get_local_ip()
            print(f"🚀 黑洞模拟器服务器已启动!")
            print(f"📁 服务目录: {script_dir}")
            print(f"🌐 本地访问: http://localhost:{port}")
            print(f"📱 局域网访问: http://{local_ip}:{port}")
            print(f"💡 其他设备可通过上述局域网地址访问")
            print("\n💡 提示:")
            print("   - 按 Ctrl+C 停止服务器")
            print("   - 在浏览器中打开上述地址即可使用")
            print("   - 支持触摸设备，可在手机上体验")
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://localhost:{port}')
                print("✅ 已自动打开浏览器")
            except:
                print("⚠️  无法自动打开浏览器，请手动访问")
            
            print("\n" + "="*50)
            print("🕳️  黑洞模拟器正在运行中...")
            print("="*50)
            
            # 启动服务器
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 端口 {port} 已被占用")
            print(f"请尝试其他端口，例如: python {__file__} 8001")
        else:
            print(f"❌ 启动服务器失败: {e}")
        return False
    except KeyboardInterrupt:
        print("\n\n🛑 服务器已停止")
        return True

def main():
    """主函数"""
    print("🕳️  黑洞模拟器 - 本地服务器")
    print("="*40)
    
    # 获取端口号
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 无效的端口号，使用默认端口 8000")
    
    # 启动服务器
    start_server(port)

if __name__ == "__main__":
    main()
