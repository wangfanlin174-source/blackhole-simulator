#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
黑洞模拟器云服务器部署脚本
支持多种云平台部署
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def create_vercel_config():
    """创建Vercel配置文件"""
    vercel_json = {
        "version": 2,
        "builds": [
            {
                "src": "*.html",
                "use": "@vercel/static"
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "/index.html"
            }
        ],
        "headers": [
            {
                "source": "/(.*)",
                "headers": [
                    {
                        "key": "Cache-Control",
                        "value": "public, max-age=0, must-revalidate"
                    }
                ]
            }
        ]
    }
    
    with open('vercel.json', 'w', encoding='utf-8') as f:
        json.dump(vercel_json, f, indent=2, ensure_ascii=False)
    
    print("✅ 已创建vercel.json配置文件")

def create_netlify_config():
    """创建Netlify配置文件"""
    netlify_toml = """[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
"""
    
    with open('netlify.toml', 'w', encoding='utf-8') as f:
        f.write(netlify_toml)
    
    print("✅ 已创建netlify.toml配置文件")

def create_github_pages_config():
    """创建GitHub Pages配置"""
    workflow_dir = Path('.github/workflows')
    workflow_dir.mkdir(parents=True, exist_ok=True)
    
    workflow_yml = """name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
"""
    
    with open('.github/workflows/deploy.yml', 'w', encoding='utf-8') as f:
        f.write(workflow_yml)
    
    print("✅ 已创建GitHub Pages部署配置")

def create_docker_config():
    """创建Docker配置"""
    dockerfile = """FROM nginx:alpine

# 复制网站文件
COPY . /usr/share/nginx/html/

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
"""
    
    nginx_conf = """events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # 静态资源缓存
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
"""
    
    docker_compose = """version: '3.8'

services:
  blackhole-simulator:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NGINX_HOST=localhost
      - NGINX_PORT=80
"""
    
    with open('Dockerfile', 'w', encoding='utf-8') as f:
        f.write(dockerfile)
    
    with open('nginx.conf', 'w', encoding='utf-8') as f:
        f.write(nginx_conf)
    
    with open('docker-compose.yml', 'w', encoding='utf-8') as f:
        f.write(docker_compose)
    
    print("✅ 已创建Docker配置文件")

def create_systemd_service():
    """创建systemd服务配置"""
    service_content = """[Unit]
Description=Black Hole Simulator Web Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory={working_dir}
ExecStart=/usr/bin/python3 {script_path}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
""".format(
        working_dir=os.getcwd(),
        script_path=os.path.join(os.getcwd(), 'start_server.py')
    )
    
    with open('blackhole-simulator.service', 'w', encoding='utf-8') as f:
        f.write(service_content)
    
    print("✅ 已创建systemd服务配置文件")

def show_deployment_options():
    """显示部署选项"""
    print("🌐 黑洞模拟器 - 永久部署方案")
    print("="*50)
    print()
    print("📋 可用的部署方案：")
    print()
    print("1. 🚀 Vercel部署（推荐）")
    print("   - 免费、快速、自动部署")
    print("   - 支持自定义域名")
    print("   - 全球CDN加速")
    print()
    print("2. 🌍 Netlify部署")
    print("   - 免费、功能丰富")
    print("   - 支持表单处理")
    print("   - 自动HTTPS")
    print()
    print("3. 📚 GitHub Pages部署")
    print("   - 完全免费")
    print("   - 与Git集成")
    print("   - 适合开源项目")
    print()
    print("4. 🐳 Docker部署")
    print("   - 容器化部署")
    print("   - 易于管理")
    print("   - 支持多种环境")
    print()
    print("5. 🔧 系统服务部署")
    print("   - 本地服务器")
    print("   - 开机自启动")
    print("   - 完全控制")
    print()

def deploy_to_vercel():
    """部署到Vercel"""
    print("🚀 部署到Vercel...")
    
    # 检查是否安装了Vercel CLI
    try:
        subprocess.run(['vercel', '--version'], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("📦 安装Vercel CLI...")
        subprocess.run(['npm', 'install', '-g', 'vercel'], check=True)
    
    # 创建配置文件
    create_vercel_config()
    
    print("🌐 开始部署...")
    subprocess.run(['vercel', '--prod'], check=True)
    
    print("✅ Vercel部署完成！")

def deploy_to_netlify():
    """部署到Netlify"""
    print("🌍 部署到Netlify...")
    
    # 创建配置文件
    create_netlify_config()
    
    print("📋 Netlify部署步骤：")
    print("1. 访问 https://netlify.com/")
    print("2. 注册/登录账号")
    print("3. 点击 'New site from Git'")
    print("4. 选择您的Git仓库")
    print("5. 构建命令留空，发布目录设为 '.'")
    print("6. 点击 'Deploy site'")
    print()
    print("💡 或者使用Netlify CLI：")
    print("npm install -g netlify-cli")
    print("netlify deploy --prod")

def setup_github_pages():
    """设置GitHub Pages"""
    print("📚 设置GitHub Pages...")
    
    # 创建配置文件
    create_github_pages_config()
    
    print("📋 GitHub Pages部署步骤：")
    print("1. 将代码推送到GitHub仓库")
    print("2. 在仓库设置中启用GitHub Pages")
    print("3. 选择 'GitHub Actions' 作为源")
    print("4. 每次推送都会自动部署")
    print()
    print("💡 仓库地址格式：")
    print("https://[用户名].github.io/[仓库名]/")

def setup_docker():
    """设置Docker部署"""
    print("🐳 设置Docker部署...")
    
    # 创建配置文件
    create_docker_config()
    
    print("📋 Docker部署命令：")
    print("docker build -t blackhole-simulator .")
    print("docker run -d -p 80:80 --name blackhole-simulator blackhole-simulator")
    print()
    print("💡 使用docker-compose：")
    print("docker-compose up -d")

def setup_systemd():
    """设置系统服务"""
    print("🔧 设置系统服务...")
    
    # 创建配置文件
    create_systemd_service()
    
    print("📋 系统服务安装步骤：")
    print("1. sudo cp blackhole-simulator.service /etc/systemd/system/")
    print("2. sudo systemctl daemon-reload")
    print("3. sudo systemctl enable blackhole-simulator")
    print("4. sudo systemctl start blackhole-simulator")
    print()
    print("💡 管理命令：")
    print("sudo systemctl status blackhole-simulator")
    print("sudo systemctl restart blackhole-simulator")
    print("sudo systemctl stop blackhole-simulator")

def main():
    """主函数"""
    show_deployment_options()
    
    while True:
        print("请选择部署方案 (1-5, q退出): ", end="")
        choice = input().strip()
        
        if choice == 'q':
            break
        elif choice == '1':
            deploy_to_vercel()
            break
        elif choice == '2':
            deploy_to_netlify()
            break
        elif choice == '3':
            setup_github_pages()
            break
        elif choice == '4':
            setup_docker()
            break
        elif choice == '5':
            setup_systemd()
            break
        else:
            print("❌ 无效选择，请重新输入")

if __name__ == "__main__":
    main()
