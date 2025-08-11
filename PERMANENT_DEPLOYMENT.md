# 🌐 黑洞模拟器永久部署指南

## 📋 问题说明

您遇到的问题是：每次都要手动打开终端运行 `python3 start_server.py` 才能启动网站，非常麻烦。

## 🚀 解决方案

### **方案1：Vercel云部署（最推荐）**

**优点**：免费、快速、自动部署、全球CDN

#### 快速部署步骤：

1. **安装Vercel CLI**：
```bash
npm install -g vercel
```

2. **一键部署**：
```bash
python3 deploy_to_cloud.py
# 选择选项1
```

3. **获得永久链接**：
部署完成后会得到一个类似 `https://your-project.vercel.app` 的永久链接

#### 手动部署步骤：

1. **注册Vercel账号**：https://vercel.com/
2. **连接GitHub仓库**：
   - 将代码推送到GitHub
   - 在Vercel中导入仓库
   - 自动部署完成

### **方案2：GitHub Pages部署**

**优点**：完全免费、与Git集成

#### 部署步骤：

1. **创建GitHub仓库**：
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/blackhole-simulator.git
git push -u origin main
```

2. **启用GitHub Pages**：
   - 在仓库设置中找到 "Pages"
   - 选择 "GitHub Actions" 作为源
   - 每次推送代码都会自动部署

3. **获得链接**：
`https://你的用户名.github.io/blackhole-simulator/`

### **方案3：Netlify部署**

**优点**：免费、功能丰富、自动HTTPS

#### 部署步骤：

1. **访问Netlify**：https://netlify.com/
2. **注册/登录账号**
3. **点击 "New site from Git"**
4. **选择您的Git仓库**
5. **构建设置**：
   - Build command: 留空
   - Publish directory: `.`
6. **点击 "Deploy site"**

### **方案4：本地系统服务（macOS/Linux）**

**优点**：完全控制、开机自启动

#### 安装步骤：

```bash
# 安装为系统服务
sudo ./start_as_service.sh
```

#### 管理命令：

```bash
# 查看服务状态
sudo systemctl status blackhole-simulator

# 启动服务
sudo systemctl start blackhole-simulator

# 停止服务
sudo systemctl stop blackhole-simulator

# 重启服务
sudo systemctl restart blackhole-simulator

# 查看日志
sudo journalctl -u blackhole-simulator -f
```

### **方案5：Docker容器化部署**

**优点**：易于管理、环境一致

#### 部署步骤：

```bash
# 构建Docker镜像
docker build -t blackhole-simulator .

# 运行容器
docker run -d -p 80:80 --name blackhole-simulator blackhole-simulator

# 或使用docker-compose
docker-compose up -d
```

## 🎯 推荐方案对比

| 方案 | 难度 | 成本 | 维护 | 推荐度 |
|------|------|------|------|--------|
| Vercel | ⭐⭐ | 免费 | 自动 | ⭐⭐⭐⭐⭐ |
| GitHub Pages | ⭐⭐ | 免费 | 自动 | ⭐⭐⭐⭐ |
| Netlify | ⭐⭐ | 免费 | 自动 | ⭐⭐⭐⭐ |
| 系统服务 | ⭐⭐⭐ | 免费 | 手动 | ⭐⭐⭐ |
| Docker | ⭐⭐⭐⭐ | 免费 | 手动 | ⭐⭐ |

## 🚀 快速开始

### **最简单的方法（推荐）**：

1. **运行部署脚本**：
```bash
python3 deploy_to_cloud.py
```

2. **选择Vercel部署**（选项1）

3. **按照提示完成部署**

4. **获得永久链接并分享给全世界！**

## 📱 部署后的好处

✅ **永久在线**：无需手动启动  
✅ **全球访问**：任何人都可以访问  
✅ **自动更新**：代码更新后自动部署  
✅ **HTTPS安全**：自动SSL证书  
✅ **CDN加速**：全球快速访问  
✅ **免费托管**：无需支付费用  

## 🔧 自定义域名

部署完成后，您还可以：

1. **购买域名**（如：blackhole-simulator.com）
2. **在部署平台配置自定义域名**
3. **获得专业的网站地址**

## 💡 小贴士

- **Vercel** 是最推荐的方案，简单快速
- **GitHub Pages** 适合开源项目
- **系统服务** 适合需要完全控制的场景
- 所有方案都支持自动HTTPS和CDN加速

## 🆘 遇到问题？

1. **查看部署日志**
2. **检查配置文件**
3. **参考官方文档**
4. **联系技术支持**

选择适合您的方案，让黑洞模拟器永远在线！
