@echo off
REM ProtoThrive Comprehensive Audit Script for Windows
REM Runs all E2E tests and generates audit report

echo.
echo ========================================
echo ProtoThrive Comprehensive Audit Suite
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm not found. Please install Node.js.
    exit /b 1
)

REM Install Playwright browsers
echo Checking Playwright browsers...
call npx playwright install chromium firefox webkit --with-deps

REM Create test results directory
if not exist test-results\screenshots mkdir test-results\screenshots

echo.
echo Running E2E Tests...
echo.

REM Run all tests
call npx playwright test --reporter=html,json,junit

REM Store test exit code
set TEST_EXIT_CODE=%ERRORLEVEL%

echo.
echo Generating Audit Report...
echo.

REM Generate audit report
call npx ts-node e2e/audit-report-generator.ts

echo.
echo ========================================
echo Audit Complete!
echo.
echo View results:
echo   - HTML Report: npx playwright show-report
echo   - Audit Report: AUDIT_REPORT.md
echo   - JSON Results: test-results/results.json
echo   - Screenshots: test-results/screenshots/
echo.

REM Exit with test exit code
exit /b %TEST_EXIT_CODE%
