#!/bin/bash

# Health check script for NRGhax Discord Bot
# Runs every 2 minutes via cron to monitor bot health

LOG_FILE="/var/log/nrghax-bot/health.log"
MAX_MEMORY_MB=512
MAX_RESTART_ATTEMPTS=3

# Ensure log directory exists
sudo mkdir -p /var/log/nrghax-bot
sudo chown coder:coder /var/log/nrghax-bot

# Check if service is running
if ! systemctl is-active --quiet nrghax-bot; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Bot service is not running, attempting restart..." >> "$LOG_FILE"
    sudo systemctl restart nrghax-bot
    sleep 5

    if systemctl is-active --quiet nrghax-bot; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Bot service restarted successfully" >> "$LOG_FILE"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] Failed to restart bot service" >> "$LOG_FILE"
    fi
    exit 1
fi

# Get bot process PID
BOT_PID=$(systemctl show -p MainPID --value nrghax-bot)

if [ "$BOT_PID" -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] Could not get bot PID" >> "$LOG_FILE"
    exit 1
fi

# Check memory usage
MEMORY_KB=$(ps -o rss= -p "$BOT_PID" 2>/dev/null)
if [ -n "$MEMORY_KB" ]; then
    MEMORY_MB=$((MEMORY_KB / 1024))

    if [ "$MEMORY_MB" -gt "$MAX_MEMORY_MB" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] High memory usage: ${MEMORY_MB}MB (max: ${MAX_MEMORY_MB}MB), restarting..." >> "$LOG_FILE"
        sudo systemctl restart nrghax-bot
        sleep 5
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Bot restarted due to high memory usage" >> "$LOG_FILE"
    fi
fi

# Check for recent errors in journal
RECENT_ERRORS=$(journalctl -u nrghax-bot --since "2 minutes ago" 2>/dev/null | grep -c "error\|ERROR\|Error")
if [ "$RECENT_ERRORS" -gt 10 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] Too many recent errors ($RECENT_ERRORS), restarting bot..." >> "$LOG_FILE"
    sudo systemctl restart nrghax-bot
    sleep 5
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Bot restarted due to error threshold" >> "$LOG_FILE"
fi

# Log health status
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] Bot healthy - PID: $BOT_PID, Memory: ${MEMORY_MB:-0}MB" >> "$LOG_FILE"