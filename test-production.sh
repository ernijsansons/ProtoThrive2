#!/bin/bash
# Production E2E Test Suite
# Tests the live production deployment

set -e

BACKEND_URL="https://backend-thermo-prod.ernijs-ansons.workers.dev"
FRONTEND_URL="https://45a72d84.protothrive-live.pages.dev"

echo "=========================================="
echo "PROTOTHRIVE PRODUCTION E2E TEST SUITE"
echo "=========================================="
echo ""
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_code="$4"
    local data="$5"
    local headers="$6"

    echo -n "Testing: $name... "

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" $headers -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" $headers)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo "1. HEALTH & STATUS CHECKS"
echo "=========================================="

test_endpoint "Backend Health Check" "GET" "$BACKEND_URL/health" "200"
test_endpoint "Backend API Status" "GET" "$BACKEND_URL/api/status" "200"
test_endpoint "Frontend Home Page" "GET" "$FRONTEND_URL/" "200"

echo ""
echo "=========================================="
echo "2. AUTHENTICATION FLOW"
echo "=========================================="

# Generate random email for testing
RANDOM_EMAIL="test_$(date +%s)@protothrive.com"
RANDOM_PASSWORD="SecurePass123!"

echo "Test User: $RANDOM_EMAIL"

# Register new user
REGISTER_DATA="{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$RANDOM_PASSWORD\",\"name\":\"E2E Test User\"}"
REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ PASS${NC} User Registration"
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    CSRF_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "  User ID: $USER_ID"
    echo "  Token length: ${#ACCESS_TOKEN}"
    echo "  CSRF Token: ${CSRF_TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} User Registration"
    echo "Response: $REGISTER_RESPONSE"
    FAILED=$((FAILED + 1))
fi

# Login with same user
LOGIN_DATA="{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$RANDOM_PASSWORD\"}"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ PASS${NC} User Login"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} User Login"
    echo "Response: $LOGIN_RESPONSE"
    FAILED=$((FAILED + 1))
fi

# Test invalid login
INVALID_LOGIN_DATA="{\"email\":\"$RANDOM_EMAIL\",\"password\":\"WrongPassword123!\"}"
INVALID_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$INVALID_LOGIN_DATA")

INVALID_HTTP_CODE=$(echo "$INVALID_LOGIN_RESPONSE" | tail -n1)
if [ "$INVALID_HTTP_CODE" = "401" ] || [ "$INVALID_HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} Invalid Login Rejected (HTTP $INVALID_HTTP_CODE)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} Invalid Login Should Be Rejected"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================="
echo "3. PROTECTED ENDPOINTS"
echo "=========================================="

# Test roadmaps endpoint with token
ROADMAPS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/roadmaps" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

ROADMAPS_HTTP_CODE=$(echo "$ROADMAPS_RESPONSE" | tail -n1)
if [ "$ROADMAPS_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} Protected Endpoint with Valid Token (HTTP 200)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} Protected Endpoint Failed"
    FAILED=$((FAILED + 1))
fi

# Test roadmaps without token
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/roadmaps")
UNAUTH_HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)

if [ "$UNAUTH_HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} Protected Endpoint Rejects Unauthorized (HTTP 401)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} Should Reject Unauthorized Access"
    FAILED=$((FAILED + 1))
fi

# Test snippets endpoint
SNIPPETS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/snippets" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

SNIPPETS_HTTP_CODE=$(echo "$SNIPPETS_RESPONSE" | tail -n1)
if [ "$SNIPPETS_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} Snippets Endpoint (HTTP 200)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} Snippets Endpoint Failed"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================="
echo "4. ROADMAP CRUD OPERATIONS"
echo "=========================================="

# Create roadmap
CREATE_ROADMAP_DATA='{"title":"E2E Test Roadmap","description":"Created by automated test","nodes":"[]","edges":"[]","status":"draft","visibility":"private"}'
CREATE_ROADMAP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/roadmaps" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_ROADMAP_DATA")

if echo "$CREATE_ROADMAP_RESPONSE" | grep -q "E2E Test Roadmap"; then
    echo -e "${GREEN}✓ PASS${NC} Create Roadmap"
    ROADMAP_ID=$(echo "$CREATE_ROADMAP_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Roadmap ID: $ROADMAP_ID"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} Create Roadmap"
    echo "Response: $CREATE_ROADMAP_RESPONSE"
    FAILED=$((FAILED + 1))
fi

# Get specific roadmap
if [ -n "$ROADMAP_ID" ]; then
    GET_ROADMAP_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/roadmaps/$ROADMAP_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    GET_ROADMAP_HTTP_CODE=$(echo "$GET_ROADMAP_RESPONSE" | tail -n1)
    if [ "$GET_ROADMAP_HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} Get Roadmap by ID"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} Get Roadmap by ID"
        FAILED=$((FAILED + 1))
    fi

    # Update roadmap
    UPDATE_ROADMAP_DATA='{"title":"Updated E2E Test Roadmap","description":"Updated by automated test"}'
    UPDATE_ROADMAP_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BACKEND_URL/api/roadmaps/$ROADMAP_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "X-CSRF-Token: $CSRF_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$UPDATE_ROADMAP_DATA")

    UPDATE_HTTP_CODE=$(echo "$UPDATE_ROADMAP_RESPONSE" | tail -n1)
    if [ "$UPDATE_HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} Update Roadmap"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} Update Roadmap"
        FAILED=$((FAILED + 1))
    fi
fi

echo ""
echo "=========================================="
echo "5. SECURITY HEADERS"
echo "=========================================="

# Check security headers
HEADERS_RESPONSE=$(curl -s -I "$BACKEND_URL/health")

if echo "$HEADERS_RESPONSE" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✓ PASS${NC} X-Frame-Options header present"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} X-Frame-Options header missing"
fi

if echo "$HEADERS_RESPONSE" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✓ PASS${NC} HSTS header present"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} HSTS header missing"
fi

if echo "$HEADERS_RESPONSE" | grep -qi "content-security-policy"; then
    echo -e "${GREEN}✓ PASS${NC} CSP header present"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} CSP header missing"
fi

echo ""
echo "=========================================="
echo "6. PERFORMANCE METRICS"
echo "=========================================="

# Measure response times
echo -n "Backend response time... "
BACKEND_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$BACKEND_URL/health")
echo "${BACKEND_TIME}s"

if (( $(echo "$BACKEND_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} Backend response under 1s"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} Backend response over 1s"
fi

echo -n "Frontend response time... "
FRONTEND_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$FRONTEND_URL/")
echo "${FRONTEND_TIME}s"

if (( $(echo "$FRONTEND_TIME < 2.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} Frontend response under 2s"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} Frontend response over 2s"
fi

echo ""
echo "=========================================="
echo "TEST RESULTS SUMMARY"
echo "=========================================="
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total:  $((PASSED + FAILED))"
echo ""

PASS_RATE=$((PASSED * 100 / (PASSED + FAILED)))
echo "Pass Rate: $PASS_RATE%"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "ALL TESTS PASSED! ✓"
    echo -e "==========================================${NC}"
    exit 0
else
    echo -e "${RED}=========================================="
    echo "SOME TESTS FAILED! ✗"
    echo -e "==========================================${NC}"
    exit 1
fi
