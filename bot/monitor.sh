#!/bin/bash

# NRGhax Bot Monitor - Real-time activity dashboard
# Usage: ./monitor.sh

clear

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to get bot status
get_bot_status() {
    if systemctl is-active --quiet nrghax-bot; then
        echo -e "${GREEN}● ONLINE${NC}"
    else
        echo -e "${RED}● OFFLINE${NC}"
    fi
}

# Function to get bot PID and resource usage
get_bot_resources() {
    local PID=$(systemctl show -p MainPID --value nrghax-bot)
    if [ "$PID" != "0" ] && [ -n "$PID" ]; then
        # Get memory usage
        if [ -f "/proc/$PID/status" ]; then
            local MEM_KB=$(grep VmRSS /proc/$PID/status 2>/dev/null | awk '{print $2}')
            local MEM_MB=$((MEM_KB / 1024))
            echo -n "Memory: ${MEM_MB}MB"
        fi

        # Get CPU usage
        local CPU=$(ps -p "$PID" -o %cpu= 2>/dev/null | tr -d ' ')
        if [ -n "$CPU" ]; then
            echo " | CPU: ${CPU}%"
        else
            echo ""
        fi
    else
        echo "N/A"
    fi
}

# Function to get last update check
get_last_update() {
    if [ -f "/var/log/nrghax-bot/update.log" ]; then
        tail -1 /var/log/nrghax-bot/update.log 2>/dev/null | grep -oP '\[\K[^\]]*' | head -1
    else
        echo "No updates yet"
    fi
}

# Function to show recent logs
show_recent_logs() {
    echo -e "${CYAN}📜 Recent Activity:${NC}"
    echo "────────────────────────────────────────────────────"
    sudo journalctl -u nrghax-bot -n 15 --no-pager 2>/dev/null | tail -15 | while IFS= read -r line; do
        if echo "$line" | grep -q "error"; then
            echo -e "${RED}$line${NC}"
        elif echo "$line" | grep -q "warn"; then
            echo -e "${YELLOW}$line${NC}"
        elif echo "$line" | grep -q "info"; then
            echo -e "${GREEN}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Main monitoring loop
while true; do
    clear

    # Header
    echo -e "${BOLD}${PURPLE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${PURPLE}║         🤖 NRGhax Bot Monitor Dashboard 🤖         ║${NC}"
    echo -e "${BOLD}${PURPLE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Status Section
    echo -e "${CYAN}📊 Status:${NC}"
    echo -e "  Bot Status: $(get_bot_status)"
    echo -e "  Resources: $(get_bot_resources)"
    echo -e "  Last Update Check: ${YELLOW}$(get_last_update)${NC}"
    echo ""

    # Quick Stats
    echo -e "${CYAN}📈 Quick Stats:${NC}"
    echo -e "  Uptime: $(systemctl show -p ActiveEnterTimestamp --value nrghax-bot 2>/dev/null | xargs -I {} date -d {} '+%s' | xargs -I {} echo $(( ($(date +%s) - {}) / 60 )) minutes)"
    echo -e "  Process ID: $(systemctl show -p MainPID --value nrghax-bot)"
    echo -e "  Restart Count: $(systemctl show -p NRestarts --value nrghax-bot 2>/dev/null || echo "0")"
    echo ""

    # Recent Logs
    show_recent_logs
    echo ""

    # Commands
    echo -e "${CYAN}⌨️  Commands:${NC}"
    echo -e "  ${GREEN}r${NC} - Restart bot    ${GREEN}s${NC} - Stop bot    ${GREEN}l${NC} - View full logs"
    echo -e "  ${GREEN}u${NC} - Force update   ${GREEN}h${NC} - Health check ${GREEN}q${NC} - Quit monitor"
    echo ""
    echo -e "${YELLOW}Auto-refresh every 5 seconds. Press any key for menu.${NC}"

    # Wait for input or timeout
    read -t 5 -n 1 key

    case $key in
        r)
            echo -e "\n${YELLOW}Restarting bot...${NC}"
            sudo systemctl restart nrghax-bot
            sleep 2
            ;;
        s)
            echo -e "\n${YELLOW}Stopping bot...${NC}"
            sudo systemctl stop nrghax-bot
            sleep 2
            ;;
        l)
            echo -e "\n${CYAN}Opening full logs (press 'q' to return)...${NC}"
            sleep 1
            sudo journalctl -u nrghax-bot -f
            ;;
        u)
            echo -e "\n${YELLOW}Running update check...${NC}"
            /home/coder/.ssh/code/mine/nrghax/bot/scripts/auto-update.sh
            sleep 3
            ;;
        h)
            echo -e "\n${YELLOW}Running health check...${NC}"
            /home/coder/.ssh/code/mine/nrghax/bot/scripts/health-check.sh
            sleep 3
            ;;
        q)
            echo -e "\n${GREEN}Goodbye!${NC}"
            exit 0
            ;;
    esac
done