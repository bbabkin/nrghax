#!/bin/bash

# Auto-update script for NRGhax Discord Bot
# Runs every 5 minutes via cron to check for updates

BOT_DIR="/home/coder/.ssh/code/mine/nrghax/bot"
LOG_FILE="/var/log/nrghax-bot/auto-update.log"

# Ensure log directory exists
sudo mkdir -p /var/log/nrghax-bot
sudo chown coder:coder /var/log/nrghax-bot

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking for updates..." >> "$LOG_FILE"

cd "$BOT_DIR/.." || exit 1

# Fetch latest changes
git fetch origin master >> "$LOG_FILE" 2>&1

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Updates found, pulling changes..." >> "$LOG_FILE"

    # Pull changes
    git pull origin master >> "$LOG_FILE" 2>&1

    # Check if bot files were updated
    if git diff --name-only "$LOCAL" "$REMOTE" | grep -q "^bot/"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bot files updated, rebuilding..." >> "$LOG_FILE"

        cd "$BOT_DIR" || exit 1

        # Install dependencies
        npm install >> "$LOG_FILE" 2>&1

        # Build the bot
        npm run build >> "$LOG_FILE" 2>&1

        # Restart the bot service
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting bot service..." >> "$LOG_FILE"
        sudo systemctl restart nrghax-bot >> "$LOG_FILE" 2>&1

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bot updated and restarted successfully" >> "$LOG_FILE"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] No bot files changed, skipping restart" >> "$LOG_FILE"
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No updates available" >> "$LOG_FILE"
fi