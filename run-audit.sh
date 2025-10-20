#!/bin/bash

# ProtoThrive Comprehensive Audit Script
# Runs all E2E tests and generates audit report

echo "🚀 ProtoThrive Comprehensive Audit Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

# Install Playwright browsers if needed
echo "${BLUE}Checking Playwright browsers...${NC}"
npx playwright install chromium firefox webkit --with-deps

# Create test results directory
mkdir -p test-results/screenshots

echo ""
echo "${BLUE}Running E2E Tests...${NC}"
echo ""

# Run all tests
npx playwright test --reporter=html,json,junit

# Check test exit code
TEST_EXIT_CODE=$?

echo ""
echo "${BLUE}Generating Audit Report...${NC}"
echo ""

# Generate audit report
npx ts-node e2e/audit-report-generator.ts

echo ""
echo "========================================"
echo "${GREEN}✅ Audit Complete!${NC}"
echo ""
echo "📊 View results:"
echo "  - HTML Report: npx playwright show-report"
echo "  - Audit Report: AUDIT_REPORT.md"
echo "  - JSON Results: test-results/results.json"
echo "  - Screenshots: test-results/screenshots/"
echo ""

# Exit with test exit code
exit $TEST_EXIT_CODE
