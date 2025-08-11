# 🌐 让全世界访问您的黑洞模拟器

## 快速开始（推荐）

### 方法1：一键启动（最简单）
```bash
cd blackhole-simulator
python3 start_public.py
```

### 方法2：手动启动
```bash
# 终端1：启动本地服务器
python3 start_server.py

# 终端2：启动ngrok隧道
ngrok http 8000
```

## 详细步骤

### 1. 安装ngrok
```bash
# macOS
brew install ngrok

# 或从官网下载：https://ngrok.com/download
```

### 2. 注册ngrok账号
- 访问：https://ngrok.com/
- 注册免费账号
- 获取authtoken

### 3. 配置ngrok
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 4. 启动服务
```bash
# 使用一键启动脚本
python3 start_public.py
```

### 5. 获得公网地址
ngrok会显示类似：
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

## 分享您的网站

获得公网地址后，您可以：

1. **分享链接**：将 `https://abc123.ngrok.io` 发送给任何人
2. **社交媒体**：在朋友圈、微博等平台分享
3. **二维码**：生成二维码，方便手机用户访问

## 注意事项

- ⚠️ **免费版限制**：每次重启ngrok，地址会变化
- 🔒 **安全考虑**：公网访问意味着任何人都能看到您的网站
- 📱 **移动端**：网站已优化移动设备访问
- 🌍 **全球访问**：世界各地的用户都可以访问

## 其他方案

### 使用frp（免费开源）
```bash
# 下载frp
wget https://github.com/fatedier/frp/releases/download/v0.51.3/frp_0.51.3_darwin_amd64.tar.gz

# 配置并启动
./frpc -c frpc.ini
```

### 部署到云平台
- **Vercel**：免费部署，永久域名
- **GitHub Pages**：免费静态网站托管
- **阿里云/腾讯云**：付费但稳定

## 故障排除

### 常见问题
1. **ngrok未安装**：运行 `brew install ngrok`
2. **端口被占用**：修改端口号 `python3 start_server.py 8001`
3. **防火墙阻止**：确保8000端口开放

### 获取帮助
- ngrok文档：https://ngrok.com/docs
- frp文档：https://gofrp.org/docs/
