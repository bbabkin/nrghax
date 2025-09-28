#!/bin/bash

# Setup script for NRGHax Bot Status Server auto-start

echo "🔧 Setting up NRGHax Bot Status Server..."

# Create logs directory if it doesn't exist
mkdir -p /home/coder/.ssh/code/mine/nrghax/bot/logs

# Copy systemd service file
echo "📋 Installing systemd service..."
sudo cp /home/coder/.ssh/code/mine/nrghax/bot/bot-status.service /etc/systemd/system/

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable the service
echo "✅ Enabling bot-status service..."
sudo systemctl enable bot-status.service

# Start the service
echo "🚀 Starting bot-status service..."
sudo systemctl start bot-status.service

# Check status
echo "📊 Service status:"
sudo systemctl status bot-status.service --no-pager

echo ""
echo "✨ Setup complete!"
echo ""
echo "The status server will now:"
echo "  • Auto-start on system boot"
echo "  • Restart automatically if it crashes"
echo "  • Run at http://localhost:3333"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status bot-status    # Check status"
echo "  sudo systemctl restart bot-status   # Restart server"
echo "  sudo systemctl stop bot-status      # Stop server"
echo "  sudo journalctl -u bot-status -f    # View logs"
echo ""