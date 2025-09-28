#!/bin/bash

# NRGhax Bot Log Viewer
# Simple script to view bot logs with color coding

echo "🤖 NRGhax Bot Live Logs"
echo "========================"
echo ""
echo "Showing live bot activity (Ctrl+C to exit)..."
echo ""

# Follow the systemd journal with color coding
sudo journalctl -u nrghax-bot -f --output=cat | while IFS= read -r line; do
    if echo "$line" | grep -q "\[error\]"; then
        echo -e "\033[0;31m$line\033[0m"  # Red for errors
    elif echo "$line" | grep -q "\[warn\]"; then
        echo -e "\033[1;33m$line\033[0m"  # Yellow for warnings
    elif echo "$line" | grep -q "\[info\]"; then
        echo -e "\033[0;32m$line\033[0m"  # Green for info
    elif echo "$line" | grep -q "command"; then
        echo -e "\033[0;36m$line\033[0m"  # Cyan for commands
    elif echo "$line" | grep -q "Discord"; then
        echo -e "\033[0;35m$line\033[0m"  # Purple for Discord events
    else
        echo "$line"  # Default color for other messages
    fi
done