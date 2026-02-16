#!/bin/bash
# OpenJoey V1 Services - Permanent Management Script
# This script manages all V1 services with proper logging and monitoring

set -e

V1_DIR="/opt/openjoey"
LOG_DIR="/var/log/openjoey"
PID_DIR="/var/run/openjoey"
SERVICES=("conversation-service" "portfolio-service" "alert-service" "whale-service" "radar-service" "sentiment-service" "signal-service" "indicator-service")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_directories() {
    log_info "Creating directories..."
    mkdir -p "$LOG_DIR"
    mkdir -p "$PID_DIR"
    chown root:root "$LOG_DIR"
    chmod 755 "$LOG_DIR"
    log_success "Directories created"
}

stop_services() {
    log_info "Stopping existing V1 services..."
    for service in "${SERVICES[@]}"; do
        pkill -f "$service.mjs" 2>/dev/null || true
        rm -f "$PID_DIR/$service.pid" 2>/dev/null || true
    done
    sleep 2
    log_success "Services stopped"
}

start_services() {
    log_info "Starting V1 services..."
    
    cd "$V1_DIR"
    
    # Start each service with proper logging
    nohup node services/conversation-service.mjs > "$LOG_DIR/conversation.log" 2>&1 &
    echo $! > "$PID_DIR/conversation-service.pid"
    log_success "Conversation service started (PID: $(cat "$PID_DIR/conversation-service.pid"))"
    
    nohup node services/portfolio-service.mjs > "$LOG_DIR/portfolio.log" 2>&1 &
    echo $! > "$PID_DIR/portfolio-service.pid"
    log_success "Portfolio service started (PID: $(cat "$PID_DIR/portfolio-service.pid"))"
    
    nohup node services/alert-service.mjs > "$LOG_DIR/alert.log" 2>&1 &
    echo $! > "$PID_DIR/alert-service.pid"
    log_success "Alert service started (PID: $(cat "$PID_DIR/alert-service.pid"))"
    
    nohup node services/whale-service.mjs > "$LOG_DIR/whale.log" 2>&1 &
    echo $! > "$PID_DIR/whale-service.pid"
    log_success "Whale service started (PID: $(cat "$PID_DIR/whale-service.pid"))"
    
    nohup node services/radar-service.mjs > "$LOG_DIR/radar.log" 2>&1 &
    echo $! > "$PID_DIR/radar-service.pid"
    log_success "Radar service started (PID: $(cat "$PID_DIR/radar-service.pid"))"
    
    nohup node services/sentiment-service.mjs > "$LOG_DIR/sentiment.log" 2>&1 &
    echo $! > "$PID_DIR/sentiment-service.pid"
    log_success "Sentiment service started (PID: $(cat "$PID_DIR/sentiment-service.pid"))"
    
    nohup node services/signal-service.mjs > "$LOG_DIR/signal.log" 2>&1 &
    echo $! > "$PID_DIR/signal-service.pid"
    log_success "Signal service started (PID: $(cat "$PID_DIR/signal-service.pid"))"
    
    nohup node services/indicator-service.mjs > "$LOG_DIR/indicator.log" 2>&1 &
    echo $! > "$PID_DIR/indicator-service.pid"
    log_success "Indicator service started (PID: $(cat "$PID_DIR/indicator-service.pid"))"
    
    log_success "All V1 services started successfully!"
}

status_services() {
    log_info "Checking V1 services status..."
    echo ""
    
    local running=0
    local stopped=0
    
    for service in "${SERVICES[@]}"; do
        if pgrep -f "$service.mjs" > /dev/null; then
            pid=$(pgrep -f "$service.mjs" | head -1)
            log_success "$service: RUNNING (PID: $pid)"
            ((running++))
        else
            log_error "$service: STOPPED"
            ((stopped++))
        fi
    done
    
    echo ""
    log_info "Summary: $running running, $stopped stopped"
}

restart_services() {
    log_info "Restarting all V1 services..."
    stop_services
    sleep 2
    start_services
    log_success "All services restarted!"
}

logs_services() {
    local service=$1
    if [ -z "$service" ]; then
        log_info "Showing logs for all services (last 50 lines)..."
        echo ""
        for svc in "${SERVICES[@]}"; do
            log_info "$svc logs:"
            tail -n 10 "$LOG_DIR/${svc%.mjs}.log" 2>/dev/null || log_warning "No logs found"
            echo ""
        done
    else
        log_info "Showing logs for $service..."
        tail -f "$LOG_DIR/$service.log"
    fi
}

health_check() {
    log_info "Running health check..."
    
    local healthy=0
    local unhealthy=0
    
    for service in "${SERVICES[@]}"; do
        if pgrep -f "$service.mjs" > /dev/null; then
            ((healthy++))
        else
            log_error "$service is not running!"
            ((unhealthy++))
        fi
    done
    
    if [ $unhealthy -gt 0 ]; then
        log_warning "Found $unhealthy unhealthy services. Restarting..."
        restart_services
    else
        log_success "All services are healthy!"
    fi
}

# Main command handler
case "${1:-deploy}" in
    start)
        create_directories
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        status_services
        ;;
    logs)
        logs_services "$2"
        ;;
    health)
        health_check
        ;;
    deploy|*)
        log_info "🚀 Deploying OpenJoey V1 Services..."
        create_directories
        stop_services
        start_services
        status_services
        log_success "✅ Deployment complete!"
        echo ""
        echo "📊 Monitor with: ./v1-services.sh status"
        echo "📋 View logs: ./v1-services.sh logs"
        echo "🔄 Restart: ./v1-services.sh restart"
        ;;
esac
