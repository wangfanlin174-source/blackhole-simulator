#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
黑洞模拟器GitHub Pages部署脚本
无需安装Node.js，直接使用Git
"""

import os
import subprocess
import sys
from pathlib import Path

def check_git():
    """检查Git是否安装"""
    try:
        subprocess.run(['git', '--version'], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def init_git_repo():
    """初始化Git仓库"""
    if not os.path.exists('.git'):
        print("📁 初始化Git仓库...")
        subprocess.run(['git', 'init'], check=True)
        print("✅ Git仓库初始化完成")
    else:
        print("✅ Git仓库已存在")

def create_github_pages_config():
    """创建GitHub Pages配置文件"""
    # 创建.github/workflows目录
    workflow_dir = Path('.github/workflows')
    workflow_dir.mkdir(parents=True, exist_ok=True)
    
    # 创建部署工作流
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

def create_readme():
    """创建README文件"""
    readme_content = """# 🌌 黑洞模拟器

一个基于Web的黑洞物理模拟器，使用HTML5 Canvas和JavaScript实现。

## 🌐 在线访问

访问地址：https://[您的用户名].github.io/[仓库名]/

## 🚀 功能特性

- 实时黑洞引力场模拟
- 可调节的物理参数
- 响应式设计，支持移动设备
- 苹果风格的用户界面

## 🛠️ 技术栈

- HTML5 Canvas
- JavaScript ES6+
- CSS3 动画和渐变
- Python HTTP服务器

## 📱 设备支持

- 桌面浏览器
- 移动设备
- iPad（横屏/竖屏自适应）

## 🔧 本地运行

```bash
python3 start_server.py
```

然后访问 http://localhost:8000

## 📄 许可证

MIT License
"""
    
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("✅ 已创建README.md文件")

def setup_github_pages():
    """设置GitHub Pages"""
    print("📚 设置GitHub Pages部署...")
    
    # 检查Git
    if not check_git():
        print("❌ 未检测到Git，请先安装Git")
        print("   访问：https://git-scm.com/downloads")
        return False
    
    # 初始化仓库
    init_git_repo()
    
    # 创建配置文件
    create_github_pages_config()
    create_readme()
    
    # 添加文件到Git
    print("📝 添加文件到Git...")
    subprocess.run(['git', 'add', '.'], check=True)
    
    # 提交更改
    print("💾 提交更改...")
    subprocess.run(['git', 'commit', '-m', 'Initial commit: Black Hole Simulator'], check=True)
    
    print("✅ GitHub Pages设置完成！")
    print()
    print("📋 下一步操作：")
    print("1. 在GitHub上创建新仓库")
    print("2. 将代码推送到GitHub：")
    print("   git remote add origin https://github.com/您的用户名/仓库名.git")
    print("   git branch -M main")
    print("   git push -u origin main")
    print("3. 在仓库设置中启用GitHub Pages")
    print("4. 选择 'GitHub Actions' 作为源")
    print("5. 等待自动部署完成")
    print()
    print("🌐 部署完成后，您的网站地址将是：")
    print("   https://您的用户名.github.io/仓库名/")
    
    return True

def main():
    """主函数"""
    print("📚 黑洞模拟器 - GitHub Pages部署")
    print("="*50)
    print()
    
    if setup_github_pages():
        print()
        print("🎉 设置完成！请按照上述步骤操作")
    else:
        print("❌ 设置失败，请检查错误信息")

if __name__ == "__main__":
    main()
