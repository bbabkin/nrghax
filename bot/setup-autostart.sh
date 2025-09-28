#!/bin/bash

# Setup script for NRGhax Bot auto-start on system boot

set -e

BOT_DIR="/home/coder/.ssh/code/mine/nrghax/bot"
SERVICE_FILE="nrghax-bot.service"
SYSTEMD_DIR="/etc/systemd/system"

echo "🤖 NRGhax Bot Auto-Start Setup"
echo "================================"

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script needs to be run with sudo for systemd setup"
    echo "Please run: sudo ./setup-autostart.sh"
    exit 1
fi

# Check Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js not found in PATH"
    echo "Please ensure Node.js is installed and in your PATH"
    exit 1
fi

echo "✅ Found Node.js at: $NODE_PATH"

# Update service file with correct node path
sed -i "s|/usr/bin/node|$NODE_PATH|g" "$BOT_DIR/$SERVICE_FILE"

# Copy service file to systemd
echo "📝 Installing systemd service..."
cp "$BOT_DIR/$SERVICE_FILE" "$SYSTEMD_DIR/"

# Set correct permissions
chmod 644 "$SYSTEMD_DIR/$SERVICE_FILE"

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
echo "⚙️  Enabling auto-start on boot..."
systemctl enable nrghax-bot.service

# Create log directory if it doesn't exist
mkdir -p "$BOT_DIR/logs"
chown -R coder:coder "$BOT_DIR/logs"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Available commands:"
echo "  Start bot:    sudo systemctl start nrghax-bot"
echo "  Stop bot:     sudo systemctl stop nrghax-bot"
echo "  Restart bot:  sudo systemctl restart nrghax-bot"
echo "  View status:  sudo systemctl status nrghax-bot"
echo "  View logs:    sudo journalctl -u nrghax-bot -f"
echo "  Monitor:      $BOT_DIR/bot-monitor.sh"
echo ""
echo "The bot will now automatically start on system boot!"
echo ""
echo "Would you like to start the bot now? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Starting NRGhax Bot..."
    systemctl start nrghax-bot
    sleep 2
    systemctl status nrghax-bot --no-pager
else
    echo "You can start the bot later with: sudo systemctl start nrghax-bot"
fi