#!/bin/bash

# Setup auto-open for the status page on user login

echo "🖥️  Setting up auto-open for status page..."

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart/

# Copy desktop entry file
cp /home/coder/.ssh/code/mine/nrghax/bot/nrghax-status-page.desktop ~/.config/autostart/

echo "✅ Auto-open configured!"
echo ""
echo "The status page will automatically open on next login."
echo "To test now, run: /home/coder/.ssh/code/mine/nrghax/bot/open-status-page.sh"