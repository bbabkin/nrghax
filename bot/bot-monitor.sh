#!/bin/bash

# NRGhax Bot Monitor Dashboard
# Real-time monitoring console for bot activity

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Bot directory
BOT_DIR="/home/coder/.ssh/code/mine/nrghax/bot"
LOG_DIR="$BOT_DIR/logs"
METRICS_FILE="$LOG_DIR/metrics.json"

# Clear screen and show header
show_header() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}              🤖 NRGhax Bot Monitor Dashboard 🤖               ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check if bot is running
check_bot_status() {
    if pgrep -f "node.*dist/index.js" > /dev/null || pgrep -f "tsx.*src/index.ts" > /dev/null; then
        PID=$(pgrep -f "node.*dist/index.js" || pgrep -f "tsx.*src/index.ts")
        echo -e "${GREEN}● Bot Status: RUNNING${NC} (PID: $PID)"

        # Get memory usage
        if [ ! -z "$PID" ]; then
            MEM=$(ps -o rss= -p $PID | awk '{printf "%.1f", $1/1024}')
            echo -e "${WHITE}  Memory Usage: ${YELLOW}${MEM} MB${NC}"
        fi
    else
        echo -e "${RED}● Bot Status: STOPPED${NC}"
    fi
}

# Show metrics
show_metrics() {
    echo ""
    echo -e "${PURPLE}📊 Bot Metrics:${NC}"

    if [ -f "$METRICS_FILE" ]; then
        # Parse JSON metrics
        COMMANDS=$(grep -o '"commandsExecuted":[0-9]*' "$METRICS_FILE" | cut -d: -f2)
        ERRORS=$(grep -o '"errorsCount":[0-9]*' "$METRICS_FILE" | cut -d: -f2)
        UPTIME=$(grep -o '"uptime":[0-9]*' "$METRICS_FILE" | cut -d: -f2)

        # Format uptime
        if [ ! -z "$UPTIME" ]; then
            DAYS=$((UPTIME / 86400))
            HOURS=$(((UPTIME % 86400) / 3600))
            MINUTES=$(((UPTIME % 3600) / 60))
            SECONDS=$((UPTIME % 60))

            UPTIME_STR=""
            [ $DAYS -gt 0 ] && UPTIME_STR="${DAYS}d "
            [ $HOURS -gt 0 ] && UPTIME_STR="${UPTIME_STR}${HOURS}h "
            [ $MINUTES -gt 0 ] && UPTIME_STR="${UPTIME_STR}${MINUTES}m "
            UPTIME_STR="${UPTIME_STR}${SECONDS}s"

            echo -e "  ${WHITE}Uptime: ${GREEN}$UPTIME_STR${NC}"
        fi

        [ ! -z "$COMMANDS" ] && echo -e "  ${WHITE}Commands Executed: ${BLUE}$COMMANDS${NC}"
        [ ! -z "$ERRORS" ] && echo -e "  ${WHITE}Error Count: ${RED}$ERRORS${NC}"
    else
        echo -e "  ${YELLOW}No metrics available yet${NC}"
    fi
}

# Show recent activity
show_activity() {
    echo ""
    echo -e "${CYAN}📝 Recent Activity:${NC}"

    if [ -f "$LOG_DIR/activity.log" ]; then
        echo -e "${WHITE}────────────────────────────────────────────────────────────────${NC}"
        tail -n 15 "$LOG_DIR/activity.log" | while IFS= read -r line; do
            # Color code based on activity type
            if [[ $line == *"BOT STARTED"* ]]; then
                echo -e "${GREEN}$line${NC}"
            elif [[ $line == *"BOT STOPPED"* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line == *"COMMAND"* ]]; then
                echo -e "${BLUE}$line${NC}"
            elif [[ $line == *"ERROR"* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line == *"API CALL"* ]]; then
                echo -e "${YELLOW}$line${NC}"
            elif [[ $line == *"HEALTH CHECK"* ]]; then
                echo -e "${PURPLE}$line${NC}"
            elif [[ $line == *"CODE UPDATE"* ]]; then
                echo -e "${CYAN}$line${NC}"
            else
                echo "$line"
            fi
        done
        echo -e "${WHITE}────────────────────────────────────────────────────────────────${NC}"
    else
        echo -e "  ${YELLOW}No activity log found${NC}"
    fi
}

# Show errors if any
show_recent_errors() {
    if [ -f "$LOG_DIR/error.log" ] && [ -s "$LOG_DIR/error.log" ]; then
        echo ""
        echo -e "${RED}⚠️  Recent Errors:${NC}"
        echo -e "${WHITE}────────────────────────────────────────────────────────────────${NC}"
        tail -n 5 "$LOG_DIR/error.log" | while IFS= read -r line; do
            echo -e "${RED}$line${NC}"
        done
        echo -e "${WHITE}────────────────────────────────────────────────────────────────${NC}"
    fi
}

# Bot control functions
start_bot() {
    echo -e "${YELLOW}Starting bot...${NC}"
    cd "$BOT_DIR"

    # Check if already running
    if pgrep -f "node.*dist/index.js" > /dev/null || pgrep -f "tsx.*src/index.ts" > /dev/null; then
        echo -e "${YELLOW}Bot is already running!${NC}"
        return
    fi

    # Build if needed
    if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
        echo -e "${YELLOW}Building bot...${NC}"
        npm run build
    fi

    # Check for production mode
    if [ "$1" == "prod" ] || [ -f ".env.production" ] && [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}Starting in PRODUCTION mode...${NC}"
        nohup npm run start:prod >> "$LOG_DIR/console.log" 2>&1 &
    else
        nohup npm start >> "$LOG_DIR/console.log" 2>&1 &
    fi
    echo -e "${GREEN}Bot started!${NC}"
    sleep 2
}

stop_bot() {
    echo -e "${YELLOW}Stopping bot...${NC}"

    # Find and kill bot process
    PID=$(pgrep -f "node.*dist/index.js" || pgrep -f "tsx.*src/index.ts")
    if [ ! -z "$PID" ]; then
        kill -SIGTERM $PID
        echo -e "${GREEN}Sent shutdown signal to bot (PID: $PID)${NC}"
        sleep 2
    else
        echo -e "${YELLOW}Bot is not running${NC}"
    fi
}

restart_bot() {
    stop_bot
    sleep 2
    start_bot
}

# Live monitoring mode
live_monitor() {
    while true; do
        show_header
        check_bot_status
        show_metrics
        show_activity
        show_recent_errors

        echo ""
        echo -e "${WHITE}────────────────────────────────────────────────────────────────${NC}"
        echo -e "${CYAN}Controls: ${WHITE}[s]tart [r]estart [k]ill [l]ogs [c]lear [q]uit${NC}"
        echo -e "${WHITE}Auto-refresh every 3 seconds...${NC}"

        # Read input with timeout
        read -t 3 -n 1 key

        case $key in
            s|S)
                start_bot
                sleep 2
                ;;
            r|R)
                restart_bot
                sleep 2
                ;;
            k|K)
                stop_bot
                sleep 2
                ;;
            l|L)
                echo ""
                echo -e "${CYAN}Showing full logs (press Ctrl+C to return)...${NC}"
                tail -f "$LOG_DIR/combined.log"
                ;;
            c|C)
                clear
                ;;
            q|Q)
                echo ""
                echo -e "${CYAN}Exiting monitor...${NC}"
                exit 0
                ;;
        esac
    done
}

# Main execution
main() {
    # Create logs directory if it doesn't exist
    mkdir -p "$LOG_DIR"

    # Check for command line arguments
    case "${1:-}" in
        start)
            start_bot
            ;;
        stop)
            stop_bot
            ;;
        restart)
            restart_bot
            ;;
        status)
            check_bot_status
            show_metrics
            ;;
        logs)
            tail -f "$LOG_DIR/combined.log"
            ;;
        *)
            # Default to live monitoring
            live_monitor
            ;;
    esac
}

# Run main function
main "$@"