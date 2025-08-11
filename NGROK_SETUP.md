# 🔧 ngrok完整配置指南

## 📋 配置步骤总览

1. **安装ngrok** → 2. **注册账号** → 3. **获取token** → 4. **本地配置** → 5. **启动服务**

## 🚀 第1步：安装ngrok

### 自动安装（推荐）
```bash
# 在blackhole-simulator目录下运行
./install_ngrok.sh
```

### 手动安装
1. 访问：https://ngrok.com/download
2. 选择macOS版本下载
3. 解压并移动到系统路径：
```bash
sudo mv ngrok /usr/local/bin/
sudo chmod +x /usr/local/bin/ngrok
```

## 📝 第2步：注册ngrok账号

1. **访问官网**：https://ngrok.com/
2. **点击 "Sign up for free"**
3. **填写注册信息**：
   - 邮箱地址
   - 密码
   - 确认密码
4. **验证邮箱**：检查邮箱并点击验证链接
5. **登录账号**：https://dashboard.ngrok.com/

## 🔑 第3步：获取authtoken

1. **登录dashboard**：https://dashboard.ngrok.com/
2. **左侧菜单**：点击 "Your Authtoken"
3. **复制token**：类似 `2abc123def456ghi789jkl`
4. **保存token**：稍后配置时需要用到

## ⚙️ 第4步：本地配置

### 配置authtoken
```bash
# 替换YOUR_TOKEN为您的实际token
ngrok config add-authtoken 2abc123def456ghi789jkl
```

### 验证配置
```bash
# 检查配置状态
ngrok config check

# 查看当前配置
ngrok config list
```

## 🌐 第5步：启动公网服务

### 一键启动（推荐）
```bash
python3 start_public.py
```

### 手动启动
```bash
# 终端1：启动本地服务器
python3 start_server.py

# 终端2：启动ngrok隧道
ngrok http 8000
```

## 📱 获得公网地址

启动成功后，您会看到类似：
```
Forwarding    https://abc123.ngrok.io -> http://localhost:8000
```

这个 `https://abc123.ngrok.io` 就是您的公网地址！

## 🔍 配置位置说明

### ngrok配置文件位置
- **macOS**: `~/.ngrok2/ngrok.yml`
- **Windows**: `%USERPROFILE%\.ngrok2\ngrok.yml`
- **Linux**: `~/.ngrok2/ngrok.yml`

### 查看配置文件
```bash
cat ~/.ngrok2/ngrok.yml
```

### 手动编辑配置
```bash
# 编辑配置文件
nano ~/.ngrok2/ngrok.yml

# 或使用其他编辑器
code ~/.ngrok2/ngrok.yml
```

## ❓ 常见问题

### Q: 安装失败怎么办？
A: 尝试手动下载安装，或检查网络连接

### Q: 配置token失败？
A: 确保token正确，检查网络连接

### Q: 启动服务失败？
A: 检查8000端口是否被占用，尝试其他端口

### Q: 无法访问公网地址？
A: 检查ngrok是否正常运行，查看错误日志

## 📞 获取帮助

- **ngrok官方文档**：https://ngrok.com/docs
- **ngrok社区**：https://community.ngrok.com/
- **故障排除**：https://ngrok.com/docs/using-ngrok/troubleshooting/

## 🎯 下一步

配置完成后，您就可以：
1. **分享链接**给任何人
2. **在社交媒体**上推广
3. **让全世界**访问您的黑洞模拟器！
