#!/bin/bash

# Script to auto-open the bot status page on login
# Add this to your ~/.config/autostart/ or ~/.bashrc

# Wait for network and status server to be ready
sleep 10

# Check if status server is running
if curl -s http://localhost:3333 > /dev/null 2>&1; then
    echo "Opening NRGHax Bot Status Page..."
    xdg-open http://localhost:3333 2>/dev/null &
else
    echo "Status server not ready yet. Please open http://localhost:3333 manually."
fi