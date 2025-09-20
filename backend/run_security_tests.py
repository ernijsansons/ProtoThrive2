#!/usr/bin/env python3
"""
Security Test Runner for ProtoThrive Backend

Run comprehensive security tests and generate report.
"""

import os
import sys
import subprocess
import json
from datetime import datetime


def run_security_tests():
    """Run security test suite and generate report"""
    print("=" * 60)
    print("ProtoThrive Security Test Suite")
    print("=" * 60)
    print(f"Started at: {datetime.now().isoformat()}\n")

    # Test categories
    test_suites = [
        ("JWT Validation", "tests/test_security.py::TestJWTValidation"),
        ("SQL Injection Prevention", "tests/test_security.py::TestSQLInjectionPrevention"),
        ("CORS Security", "tests/test_security.py::TestCORSSecurity"),
        ("Input Validation", "tests/test_security.py::TestInputValidation"),
        ("Rate Limiting", "tests/test_security.py::TestRateLimiting"),
        ("OWASP Top 10", "tests/test_security.py::TestOWASPTop10"),
        ("Performance Security", "tests/test_security.py::TestPerformanceSecurity")
    ]

    results = {}
    all_passed = True

    for name, test_path in test_suites:
        print(f"\nRunning: {name}")
        print("-" * 40)

        try:
            # Run pytest for specific test class
            result = subprocess.run(
                ["python", "-m", "pytest", test_path, "-v", "--tb=short"],
                capture_output=True,
                text=True,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )

            if result.returncode == 0:
                print(f"✅ {name}: PASSED")
                results[name] = "PASSED"
            else:
                print(f"❌ {name}: FAILED")
                results[name] = "FAILED"
                all_passed = False

                # Print failure details
                if result.stdout:
                    print("\nTest Output:")
                    print(result.stdout[-500:])  # Last 500 chars

        except Exception as e:
            print(f"❌ {name}: ERROR - {e}")
            results[name] = f"ERROR: {e}"
            all_passed = False

    # Generate report
    print("\n" + "=" * 60)
    print("SECURITY TEST REPORT")
    print("=" * 60)

    for name, status in results.items():
        status_emoji = "✅" if status == "PASSED" else "❌"
        print(f"{status_emoji} {name}: {status}")

    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL SECURITY TESTS PASSED!")
        print("The application meets security requirements.")
    else:
        print("⚠️  SECURITY TESTS FAILED!")
        print("Critical security issues detected. DO NOT DEPLOY!")

    print(f"\nCompleted at: {datetime.now().isoformat()}")
    print("=" * 60)

    # Write results to file
    report = {
        "timestamp": datetime.now().isoformat(),
        "results": results,
        "all_passed": all_passed
    }

    with open("security_test_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\nDetailed report saved to: security_test_report.json")

    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)


def check_dependencies():
    """Check if required dependencies are installed"""
    required = ["pytest", "pytest-cov", "pytest-asyncio"]
    missing = []

    for package in required:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing.append(package)

    if missing:
        print(f"Missing dependencies: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        sys.exit(1)


if __name__ == "__main__":
    # For development, mock dependencies if needed
    try:
        check_dependencies()
    except SystemExit:
        print("\nNote: Some test dependencies are missing.")
        print("For full testing, install: pip install pytest pytest-cov pytest-asyncio")
        print("\nContinuing with basic validation...\n")

    run_security_tests()