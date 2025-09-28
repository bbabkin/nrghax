#!/bin/bash

# PM2 Setup Script for NRGhax Bot
# This is an easier alternative to systemd for auto-start

set -e

BOT_DIR="/home/coder/.ssh/code/mine/nrghax/bot"

echo "🤖 NRGhax Bot PM2 Auto-Start Setup"
echo "===================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing PM2 globally..."
    npm install -g pm2
fi

echo "✅ PM2 is installed"

cd "$BOT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing bot dependencies..."
    npm install
fi

# Build the bot
echo "🔨 Building bot..."
npm run build

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
pm2 stop nrghax-bot 2>/dev/null || true
pm2 delete nrghax-bot 2>/dev/null || true

# Start bot with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
echo "💾 Saving PM2 process list..."
pm2 save

# Setup PM2 to start on boot
echo "⚙️  Setting up PM2 startup script..."
pm2 startup systemd -u coder --hp /home/coder 2>/dev/null || {
    echo ""
    echo "⚠️  To enable auto-start on boot, run the following command:"
    echo ""
    pm2 startup systemd -u coder --hp /home/coder | tail -n 1
    echo ""
}

# Show status
echo ""
echo "✨ Setup complete!"
echo ""
pm2 status

echo ""
echo "📊 Useful PM2 commands:"
echo "  View status:    pm2 status"
echo "  View logs:      pm2 logs nrghax-bot"
echo "  Monitor:        pm2 monit"
echo "  Restart:        pm2 restart nrghax-bot"
echo "  Stop:           pm2 stop nrghax-bot"
echo "  Start:          pm2 start nrghax-bot"
echo ""
echo "🖥️  For the monitoring dashboard, run:"
echo "  $BOT_DIR/bot-monitor.sh"
echo ""
echo "The bot is now running and will auto-start on system boot!"