#!/bin/bash

echo "🔧 黑洞模拟器 - 系统服务安装"
echo "================================"

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用sudo运行此脚本"
    echo "用法: sudo ./start_as_service.sh"
    exit 1
fi

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="blackhole-simulator"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "📁 工作目录: $SCRIPT_DIR"
echo "🔧 服务名称: $SERVICE_NAME"

# 创建服务配置文件
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Black Hole Simulator Web Server
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/python3 $SCRIPT_DIR/start_server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ 已创建服务配置文件: $SERVICE_FILE"

# 重新加载systemd
systemctl daemon-reload

# 启用服务
systemctl enable "$SERVICE_NAME"

# 启动服务
systemctl start "$SERVICE_NAME"

# 检查服务状态
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📋 服务管理命令："
    echo "  查看状态: sudo systemctl status $SERVICE_NAME"
    echo "  启动服务: sudo systemctl start $SERVICE_NAME"
    echo "  停止服务: sudo systemctl stop $SERVICE_NAME"
    echo "  重启服务: sudo systemctl restart $SERVICE_NAME"
    echo "  查看日志: sudo journalctl -u $SERVICE_NAME -f"
    echo ""
    echo "🌐 访问地址："
    echo "   本地访问: http://localhost:8000"
    echo "   局域网访问: http://$(hostname -I | awk '{print $1}'):8000"
    echo ""
    echo "💡 服务将在系统启动时自动运行"
else
    echo "❌ 服务启动失败"
    echo "请检查日志: sudo journalctl -u $SERVICE_NAME -n 20"
    exit 1
fi
