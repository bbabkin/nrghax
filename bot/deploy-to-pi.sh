#!/bin/bash

# NRGHax Discord Bot - Raspberry Pi Deployment Script
# This script prepares the bot for deployment on a Raspberry Pi

echo "🤖 NRGHax Discord Bot - Raspberry Pi Deployment Setup"
echo "======================================================"

# Check if running on Raspberry Pi (optional check)
if [ -f /proc/device-tree/model ]; then
    MODEL=$(tr -d '\0' < /proc/device-tree/model)
    echo "✅ Detected: $MODEL"
else
    echo "⚠️  Warning: Not running on Raspberry Pi"
    echo "   Continuing anyway for testing purposes..."
fi

# 1. Install Node.js if not present
echo ""
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js $(node -v) is installed"
fi

# 2. Install PM2 globally for process management
echo ""
echo "📦 Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is installed"
fi

# 3. Install dependencies
echo ""
echo "📦 Installing bot dependencies..."
npm install --production

# 4. Build the TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

# 5. Create PM2 ecosystem file
echo ""
echo "📝 Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nrghax-bot',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Raspberry Pi specific optimizations
    max_restarts: 10,
    min_uptime: '10s',

    // Auto-restart on reboot
    cron_restart: '@reboot'
  }]
}
EOF

# 6. Create systemd service for auto-start
echo ""
echo "🔧 Setting up systemd service..."
sudo tee /etc/systemd/system/nrghax-bot.service > /dev/null << EOF
[Unit]
Description=NRGHax Discord Bot
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$PWD
ExecStart=$(which pm2) start ecosystem.config.js
ExecStop=$(which pm2) stop nrghax-bot
ExecReload=$(which pm2) reload nrghax-bot
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 7. Create log directory
mkdir -p logs

# 8. Check .env file
echo ""
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "   Please copy .env.example to .env and configure it:"
    echo "   cp .env.example .env"
    echo "   nano .env"
else
    echo "✅ .env file found"
fi

# 9. Display next steps
echo ""
echo "======================================================"
echo "✅ Raspberry Pi deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure .env file is configured with your Discord token"
echo "2. Start the bot: pm2 start ecosystem.config.js"
echo "3. Save PM2 process list: pm2 save"
echo "4. Enable auto-start on boot: sudo systemctl enable nrghax-bot"
echo "5. Start the service: sudo systemctl start nrghax-bot"
echo ""
echo "Useful commands:"
echo "- View logs: pm2 logs nrghax-bot"
echo "- Monitor: pm2 monit"
echo "- Restart: pm2 restart nrghax-bot"
echo "- Stop: pm2 stop nrghax-bot"
echo "- Service status: sudo systemctl status nrghax-bot"
echo ""
echo "Performance tips for Raspberry Pi:"
echo "- The bot is configured to use max 200MB RAM"
echo "- Auto-restarts if memory limit is exceeded"
echo "- Logs are stored in ./logs directory"
echo "- Consider using a cooling solution for 24/7 operation"
echo "======================================================