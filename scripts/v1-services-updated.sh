#!/bin/bash
# OpenJoey V1 Services - Permanent Management Script
set -e

V1_DIR="/opt/openjoey"
LOG_DIR="/var/log/openjoey"
PID_DIR="/var/run/openjoey"
SERVICES="price-service conversation-service portfolio-service alert-service whale-service radar-service sentiment-service signal-service indicator-service"

create_directories() {
    mkdir -p "$LOG_DIR" "$PID_DIR"
    chmod 755 "$LOG_DIR"
}

stop_services() {
    for service in $SERVICES; do
        pkill -f "$service.mjs" 2>/dev/null || true
        rm -f "$PID_DIR/$service.pid" 2>/dev/null || true
    done
    sleep 2
}

start_services() {
    cd "$V1_DIR"
    
    # Start price service first (others depend on it)
    nohup node services/price-service.mjs > "$LOG_DIR/price.log" 2>&1 &
    echo $! > "$PID_DIR/price-service.pid"
    sleep 2  # Let price service initialize
    
    nohup node services/conversation-service.mjs > "$LOG_DIR/conversation.log" 2>&1 &
    echo $! > "$PID_DIR/conversation-service.pid"
    
    nohup node services/portfolio-service.mjs > "$LOG_DIR/portfolio.log" 2>&1 &
    echo $! > "$PID_DIR/portfolio-service.pid"
    
    nohup node services/alert-service.mjs > "$LOG_DIR/alert.log" 2>&1 &
    echo $! > "$PID_DIR/alert-service.pid"
    
    nohup node services/whale-service.mjs > "$LOG_DIR/whale.log" 2>&1 &
    echo $! > "$PID_DIR/whale-service.pid"
    
    nohup node services/radar-service.mjs > "$LOG_DIR/radar.log" 2>&1 &
    echo $! > "$PID_DIR/radar-service.pid"
    
    nohup node services/sentiment-service.mjs > "$LOG_DIR/sentiment.log" 2>&1 &
    echo $! > "$PID_DIR/sentiment-service.pid"
    
    nohup node services/signal-service.mjs > "$LOG_DIR/signal.log" 2>&1 &
    echo $! > "$PID_DIR/signal-service.pid"
    
    nohup node services/indicator-service.mjs > "$LOG_DIR/indicator.log" 2>&1 &
    echo $! > "$PID_DIR/indicator-service.pid"
}

check_status() {
    echo "OpenJoey V1 Services Status:"
    echo ""
    for service in $SERVICES; do
        pid_file="$PID_DIR/$service.pid"
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file" 2>/dev/null || echo "")
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                echo "✅ $service: RUNNING (PID: $pid)"
            else
                echo "❌ $service: NOT RUNNING (stale PID file)"
            fi
        else
            # Check if process is running anyway
            if pgrep -f "$service.mjs" > /dev/null; then
                echo "✅ $service: RUNNING (no PID file)"
            else
                echo "❌ $service: NOT RUNNING"
            fi
        fi
    done
}

case "${1:-status}" in
    start)
        echo "Starting OpenJoey V1 Services..."
        create_directories
        stop_services
        start_services
        sleep 3
        check_status
        ;;
    stop)
        echo "Stopping OpenJoey V1 Services..."
        stop_services
        ;;
    restart)
        echo "Restarting OpenJoey V1 Services..."
        create_directories
        stop_services
        sleep 2
        start_services
        sleep 3
        check_status
        ;;
    status)
        check_status
        ;;
    logs)
        service="${2:-all}"
        if [ "$service" = "all" ]; then
            tail -f "$LOG_DIR"/*.log
        else
            tail -f "$LOG_DIR/$service.log"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [service]}"
        exit 1
        ;;
esac
