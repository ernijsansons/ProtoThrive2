#!/bin/bash
# ProtoThrive Production Monitoring Script
# Continuous health monitoring for production deployment

BACKEND_URL="https://backend-thermo-prod.ernijs-ansons.workers.dev"
FRONTEND_URL="https://45a72d84.protothrive-live.pages.dev"
CHECK_INTERVAL=60  # seconds
ALERT_THRESHOLD=3  # failures before alert

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# State
CONSECUTIVE_FAILURES=0
LAST_CHECK_TIME=$(date +%s)

# Log file
LOG_FILE="production-monitoring.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    local message="$1"
    log "🚨 ALERT: $message"
    # Here you could add integrations to:
    # - Send email: echo "$message" | mail -s "ProtoThrive Alert" admin@example.com
    # - Post to Slack: curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$message\"}" $SLACK_WEBHOOK
    # - SMS via Twilio: curl -X POST ... (Twilio API)
}

check_backend_health() {
    local response=$(curl -s -w "\n%{http_code}" --max-time 10 "$BACKEND_URL/health")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        local status=$(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$status" = "healthy" ]; then
            return 0
        fi
    fi
    return 1
}

check_frontend_health() {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL/")
    if [ "$http_code" = "200" ]; then
        return 0
    fi
    return 1
}

check_api_auth() {
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL/api/roadmaps")
    # Should return 401 (unauthorized) which means API is working
    if [ "$http_code" = "401" ]; then
        return 0
    fi
    return 1
}

check_database_connectivity() {
    local response=$(curl -s "$BACKEND_URL/health")
    if echo "$response" | grep -q '"database":true'; then
        return 0
    fi
    return 1
}

check_cache_connectivity() {
    local response=$(curl -s "$BACKEND_URL/health")
    if echo "$response" | grep -q '"cache":true'; then
        return 0
    fi
    return 1
}

measure_response_time() {
    local url="$1"
    local time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 "$url")
    echo "$time"
}

run_health_checks() {
    local all_passed=true
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')

    echo ""
    echo "=========================================="
    echo "Health Check: $timestamp"
    echo "=========================================="

    # Backend Health
    if check_backend_health; then
        echo -e "${GREEN}✓${NC} Backend Health: OK"
    else
        echo -e "${RED}✗${NC} Backend Health: FAILED"
        all_passed=false
    fi

    # Frontend Health
    if check_frontend_health; then
        echo -e "${GREEN}✓${NC} Frontend Health: OK"
    else
        echo -e "${RED}✗${NC} Frontend Health: FAILED"
        all_passed=false
    fi

    # API Authentication
    if check_api_auth; then
        echo -e "${GREEN}✓${NC} API Auth: OK"
    else
        echo -e "${RED}✗${NC} API Auth: FAILED"
        all_passed=false
    fi

    # Database Connectivity
    if check_database_connectivity; then
        echo -e "${GREEN}✓${NC} Database: Connected"
    else
        echo -e "${RED}✗${NC} Database: Disconnected"
        all_passed=false
    fi

    # Cache Connectivity
    if check_cache_connectivity; then
        echo -e "${GREEN}✓${NC} Cache: Connected"
    else
        echo -e "${RED}✗${NC} Cache: Disconnected"
        all_passed=false
    fi

    # Response Times
    backend_time=$(measure_response_time "$BACKEND_URL/health")
    frontend_time=$(measure_response_time "$FRONTEND_URL/")

    echo ""
    echo "Response Times:"
    echo "  Backend:  ${backend_time}s"
    echo "  Frontend: ${frontend_time}s"

    # Check if response times are acceptable
    if (( $(awk 'BEGIN {print ("'$backend_time'" > 2.0)}') )); then
        echo -e "  ${YELLOW}⚠${NC} Backend response time high"
        all_passed=false
    fi

    if (( $(awk 'BEGIN {print ("'$frontend_time'" > 3.0)}') )); then
        echo -e "  ${YELLOW}⚠${NC} Frontend response time high"
        all_passed=false
    fi

    if [ "$all_passed" = true ]; then
        CONSECUTIVE_FAILURES=0
        echo -e "\n${GREEN}All checks passed!${NC}"
        log "✓ All health checks passed"
        return 0
    else
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        echo -e "\n${RED}Some checks failed!${NC}"
        log "✗ Health check failed (consecutive failures: $CONSECUTIVE_FAILURES)"

        if [ $CONSECUTIVE_FAILURES -ge $ALERT_THRESHOLD ]; then
            alert "ProtoThrive production health checks failing! $CONSECUTIVE_FAILURES consecutive failures detected."
        fi
        return 1
    fi
}

print_banner() {
    clear
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║  ProtoThrive Production Monitor          ║"
    echo "║  Status: ACTIVE                          ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    echo "Backend:  $BACKEND_URL"
    echo "Frontend: $FRONTEND_URL"
    echo "Interval: ${CHECK_INTERVAL}s"
    echo "Log:      $LOG_FILE"
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    echo ""
}

# Main monitoring loop
main() {
    print_banner
    log "Production monitoring started"

    while true; do
        run_health_checks

        echo ""
        echo "Next check in ${CHECK_INTERVAL} seconds..."
        sleep $CHECK_INTERVAL

        # Refresh banner every check
        print_banner
    done
}

# Handle Ctrl+C gracefully
trap 'echo ""; log "Production monitoring stopped"; exit 0' INT

# Run main loop
main
