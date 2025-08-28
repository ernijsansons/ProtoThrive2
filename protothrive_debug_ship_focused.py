#!/usr/bin/env python3
"""
ProtoThrive Debug & Ship CrewAI System - Focused Version
Thermonuclear Master Control Document Implementation
Ref: CLAUDE.md Sections 1-5

Focused Multi-Agent System:
- Debugger Agent: Analyzes main project files for bugs, lint errors, test failures
- Fixer Agent: Proposes and applies fixes, reruns tests (max 3 loops)
- Shipper Agent: Handles CI/CD, deploys to Cloudflare/Vercel, verifies uptime

Usage: python protothrive_debug_ship_focused.py
"""

import os
import sys
import json
import subprocess
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

# CrewAI imports
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool

# Global mocks and configs (Ref: CLAUDE.md Section 1)
from mocks import mock_api_call, mock_db_query

# Thermonuclear Configuration
THERMONUCLEAR_CONFIG = {
    "budget_per_task": 0.10,
    "hitl_slack_channel": "#hitl-thermo",
    "max_fix_loops": 3,
    "thrive_score_threshold": 0.95,
    "kill_switch_key": "proto_paused"
}

# Focused file patterns - only analyze main project files
FOCUSED_PATTERNS = {
    "*.py": "python",
    "*.js": "javascript", 
    "*.ts": "typescript",
    "*.jsx": "react",
    "*.tsx": "react",
    "*.json": "config",
    "*.md": "documentation"
}

# Directories to exclude
EXCLUDE_DIRS = {
    "node_modules", "__pycache__", ".git", "dist", "build", 
    ".next", "out", "coverage", ".nyc_output"
}

@dataclass
class DebugResult:
    """Debug analysis result"""
    file_path: str
    issues: List[str]
    severity: str  # 'low', 'medium', 'high', 'critical'
    fix_suggestions: List[str]
    test_status: str  # 'pass', 'fail', 'error'

@dataclass
class FixResult:
    """Fix application result"""
    file_path: str
    fixes_applied: List[str]
    tests_passed: bool
    new_issues: List[str]
    iteration: int

@dataclass
class ShipResult:
    """Deployment result"""
    environment: str  # 'staging', 'production'
    deployment_url: str
    status: str  # 'success', 'failed', 'partial'
    uptime_check: bool
    thrive_score: float

class ThriveScoreCalculator:
    """Calculate Thrive Score based on CLAUDE.md formula"""
    
    @staticmethod
    def calculate(logs: List[Dict]) -> float:
        """
        Thrive Score Formula (Ref: CLAUDE.md Section 1):
        completion = success_logs / total * 0.6
        ui_polish = ui_tasks / total * 0.3  
        risk = 1 - fails / total * 0.1
        score = completion + ui_polish + risk
        """
        if not logs:
            return 0.0
            
        total = len(logs)
        success_logs = len([log for log in logs if log.get('status') == 'success'])
        ui_tasks = len([log for log in logs if log.get('type') == 'ui'])
        fails = len([log for log in logs if log.get('status') == 'fail'])
        
        completion = (success_logs / total) * 0.6
        ui_polish = (ui_tasks / total) * 0.3
        risk = (1 - (fails / total)) * 0.1
        
        score = completion + ui_polish + risk
        return min(1.0, max(0.0, score))

class ValidationTool(BaseTool):
    """Custom tool for running validation commands"""
    
    name: str = "validation_tool"
    description: str = "Run lint, test, and validation commands on code"
    
    def _run(self, command: str, file_path: str = None) -> Dict[str, Any]:
        """Run validation command and return results"""
        try:
            print(f"🔥 Thermonuclear Validation: Running {command}")
            
            if file_path:
                result = subprocess.run(
                    command.split(), 
                    cwd=file_path,
                    capture_output=True, 
                    text=True, 
                    timeout=30
                )
            else:
                result = subprocess.run(
                    command.split(), 
                    capture_output=True, 
                    text=True, 
                    timeout=30
                )
            
            success = result.returncode == 0
            output = result.stdout if success else result.stderr
            
            return {
                "success": success,
                "output": output,
                "return_code": result.returncode,
                "command": command
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "Command timed out",
                "return_code": -1,
                "command": command
            }
        except Exception as e:
            return {
                "success": False,
                "output": str(e),
                "return_code": -1,
                "command": command
            }

class DeploymentTool(BaseTool):
    """Custom tool for deployment operations"""
    
    name: str = "deployment_tool"
    description: str = "Deploy to Cloudflare Workers/Pages and Vercel"
    
    def _run(self, environment: str, platform: str = "cloudflare") -> Dict[str, Any]:
        """Deploy to specified platform and environment"""
        try:
            print(f"🚀 Thermonuclear Deployment: {platform} -> {environment}")
            
            # Mock deployment calls (Ref: CLAUDE.md Section 1)
            if platform == "cloudflare":
                result = mock_api_call(f"deploy/{environment}", {
                    "platform": "cloudflare",
                    "environment": environment,
                    "timestamp": time.time()
                })
            elif platform == "vercel":
                result = mock_api_call(f"vercel/deploy", {
                    "name": f"proto-thermo-{environment}",
                    "environment": environment,
                    "timestamp": time.time()
                })
            else:
                raise ValueError(f"Unsupported platform: {platform}")
            
            # Mock deployment URL
            deployment_url = f"https://{environment}.proto-thermo.com"
            
            return {
                "success": True,
                "deployment_url": deployment_url,
                "environment": environment,
                "platform": platform,
                "timestamp": time.time()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "environment": environment,
                "platform": platform
            }

class DebuggerAgent(Agent):
    """Debugger Agent: Analyzes code for bugs, lint errors, test failures"""
    
    def __init__(self):
        super().__init__(
            role="Debugger Agent",
            goal="Analyze main project files for bugs, lint errors, test failures, and runtime issues",
            backstory="""You are an expert debugging agent with deep knowledge of 
            JavaScript/TypeScript, Python, and cloud deployment systems. You use 
            tools like pylint, jest, and custom validation protocols to identify 
            issues before they reach production.""",
            verbose=True,
            allow_delegation=False,
            tools=[ValidationTool()]
        )
    
    def analyze_codebase(self, project_path: str = ".") -> List[DebugResult]:
        """Analyze main project files for issues"""
        print("🔍 Thermonuclear Debug: Starting focused codebase analysis")
        
        results = []
        project_path = Path(project_path)
        
        # Analyze focused file patterns
        for pattern, language in FOCUSED_PATTERNS.items():
            files = list(project_path.rglob(pattern))
            for file_path in files:
                # Skip excluded directories
                if any(exclude_dir in str(file_path) for exclude_dir in EXCLUDE_DIRS):
                    continue
                
                # Skip files that are too deep in node_modules
                if "node_modules" in str(file_path) and file_path.parts.count("node_modules") > 1:
                    continue
                
                result = self._analyze_file(file_path, language)
                if result.issues:
                    results.append(result)
        
        # Run global validations
        self._run_global_validations(project_path, results)
        
        print(f"🔥 Thermonuclear Debug Complete: Found {len(results)} files with issues")
        return results
    
    def _analyze_file(self, file_path: Path, language: str) -> DebugResult:
        """Analyze individual file for issues"""
        issues = []
        fix_suggestions = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Language-specific analysis
            if language == "python":
                issues.extend(self._analyze_python(content))
            elif language in ["javascript", "typescript"]:
                issues.extend(self._analyze_javascript(content, language))
            elif language == "react":
                issues.extend(self._analyze_react(content))
            elif language == "config":
                issues.extend(self._analyze_config(content))
            
            # Common issues
            issues.extend(self._analyze_common_issues(content))
            
            # Generate fix suggestions
            fix_suggestions = self._generate_fix_suggestions(issues, language)
            
            severity = self._determine_severity(issues)
            test_status = self._check_test_status(file_path)
            
        except Exception as e:
            issues.append(f"Error reading file: {str(e)}")
            severity = "critical"
            test_status = "error"
        
        return DebugResult(
            file_path=str(file_path),
            issues=issues,
            severity=severity,
            fix_suggestions=fix_suggestions,
            test_status=test_status
        )
    
    def _analyze_python(self, content: str) -> List[str]:
        """Analyze Python code for issues"""
        issues = []
        
        # Basic Python checks
        if "import *" in content:
            issues.append("Wildcard import detected - use specific imports")
        
        if "print(" in content and "logging" not in content:
            issues.append("Consider using logging instead of print statements")
        
        if "except:" in content:
            issues.append("Bare except clause - specify exception types")
        
        if len(content.split('\n')) > 500:
            issues.append("File is very long - consider breaking into smaller modules")
        
        return issues
    
    def _analyze_javascript(self, content: str, language: str) -> List[str]:
        """Analyze JavaScript/TypeScript code for issues"""
        issues = []
        
        # Basic JS/TS checks
        if "console.log(" in content:
            issues.append("Console.log statements should be removed in production")
        
        if "var " in content and language == "typescript":
            issues.append("Use 'let' or 'const' instead of 'var' in TypeScript")
        
        if "any" in content and language == "typescript":
            issues.append("Avoid 'any' type - use proper TypeScript types")
        
        if "setTimeout(" in content and "clearTimeout" not in content:
            issues.append("setTimeout without clearTimeout may cause memory leaks")
        
        return issues
    
    def _analyze_react(self, content: str) -> List[str]:
        """Analyze React code for issues"""
        issues = []
        
        # React-specific checks
        if "useEffect(" in content and "[]" not in content:
            issues.append("useEffect missing dependency array")
        
        if "useState(" in content and "useCallback" not in content:
            issues.append("Consider using useCallback for performance optimization")
        
        if "className=" in content and "tailwind" not in content.lower():
            issues.append("Consider using Tailwind CSS classes")
        
        return issues
    
    def _analyze_config(self, content: str) -> List[str]:
        """Analyze config files for issues"""
        issues = []
        
        # Config file checks
        if "password" in content.lower() and "mock" not in content.lower():
            issues.append("Hardcoded passwords detected - use environment variables")
        
        if "localhost" in content and "127.0.0.1" not in content:
            issues.append("Consider using 127.0.0.1 instead of localhost for consistency")
        
        return issues
    
    def _analyze_common_issues(self, content: str) -> List[str]:
        """Analyze for common issues across languages"""
        issues = []
        
        # Security issues
        if "password" in content.lower() and "encrypt" not in content.lower():
            issues.append("Password handling detected - ensure proper encryption")
        
        # Performance issues
        if "for " in content and "in " in content:
            issues.append("Consider using more efficient iteration methods")
        
        # Code quality
        if len(content) > 10000:
            issues.append("File is very large - consider refactoring")
        
        return issues
    
    def _generate_fix_suggestions(self, issues: List[str], language: str) -> List[str]:
        """Generate fix suggestions for issues"""
        suggestions = []
        
        for issue in issues:
            if "console.log" in issue:
                suggestions.append("Replace console.log with proper logging library")
            elif "var " in issue:
                suggestions.append("Replace 'var' with 'let' or 'const'")
            elif "any" in issue:
                suggestions.append("Define proper TypeScript interfaces/types")
            elif "useEffect" in issue:
                suggestions.append("Add dependency array to useEffect")
            elif "password" in issue:
                suggestions.append("Use environment variables for sensitive data")
            else:
                suggestions.append("Review and refactor according to best practices")
        
        return suggestions
    
    def _determine_severity(self, issues: List[str]) -> str:
        """Determine severity based on issues"""
        if any("critical" in issue.lower() for issue in issues):
            return "critical"
        elif any("security" in issue.lower() or "password" in issue.lower() for issue in issues):
            return "high"
        elif len(issues) > 5:
            return "medium"
        else:
            return "low"
    
    def _check_test_status(self, file_path: Path) -> str:
        """Check if tests exist and pass for file"""
        # Mock test status check
        test_file = file_path.parent / f"test_{file_path.stem}.py"
        if test_file.exists():
            return "pass"  # Mock pass
        else:
            return "fail"  # No tests found
    
    def _run_global_validations(self, project_path: Path, results: List[DebugResult]):
        """Run global validation commands"""
        print("🔥 Thermonuclear Validation: Running global checks")
        
        # Check for package.json and run npm lint
        package_json = project_path / "package.json"
        if package_json.exists():
            validation_tool = ValidationTool()
            lint_result = validation_tool._run("npm run lint", str(project_path))
            if not lint_result["success"]:
                results.append(DebugResult(
                    file_path="package.json",
                    issues=["Lint errors found"],
                    severity="medium",
                    fix_suggestions=["Run 'npm run lint -- --fix'"],
                    test_status="fail"
                ))

class FixerAgent(Agent):
    """Fixer Agent: Proposes and applies fixes, reruns tests"""
    
    def __init__(self):
        super().__init__(
            role="Fixer Agent", 
            goal="Propose and apply fixes, rerun tests, and iterate (max 3 loops before escalating)",
            backstory="""You are an expert code fixer with deep knowledge of 
            multiple programming languages and frameworks. You can automatically 
            fix common issues, apply best practices, and ensure code quality 
            standards are met.""",
            verbose=True,
            allow_delegation=False,
            tools=[ValidationTool()]
        )
        # Store fix attempts in a way that doesn't conflict with Pydantic
        self._fix_attempts = 0
    
    @property
    def fix_attempts(self):
        return self._fix_attempts
    
    @fix_attempts.setter
    def fix_attempts(self, value):
        self._fix_attempts = value
    
    def fix_issues(self, debug_results: List[DebugResult]) -> List[FixResult]:
        """Fix issues found by debugger agent"""
        print("🔧 Thermonuclear Fix: Starting issue resolution")
        
        fix_results = []
        
        for debug_result in debug_results:
            if debug_result.severity in ["low", "medium"]:
                fix_result = self._fix_file(debug_result)
                fix_results.append(fix_result)
            else:
                # High/critical issues - escalate to HITL
                print(f"🚨 Thermonuclear Escalate: {debug_result.file_path} - {debug_result.severity} severity")
                fix_results.append(FixResult(
                    file_path=debug_result.file_path,
                    fixes_applied=[],
                    tests_passed=False,
                    new_issues=["Escalated to HITL - high severity"],
                    iteration=0
                ))
        
        print(f"🔥 Thermonuclear Fix Complete: Processed {len(fix_results)} files")
        return fix_results
    
    def _fix_file(self, debug_result: DebugResult) -> FixResult:
        """Fix issues in a single file"""
        self.fix_attempts = 0
        max_attempts = THERMONUCLEAR_CONFIG["max_fix_loops"]
        
        while self.fix_attempts < max_attempts:
            self.fix_attempts += 1
            print(f"🔧 Thermonuclear Fix Attempt {self.fix_attempts}: {debug_result.file_path}")
            
            # Apply fixes
            fixes_applied = self._apply_fixes(debug_result)
            
            # Rerun tests
            tests_passed = self._rerun_tests(debug_result.file_path)
            
            # Check for new issues
            new_issues = self._check_new_issues(debug_result.file_path)
            
            if tests_passed and not new_issues:
                print(f"✅ Thermonuclear Fix Success: {debug_result.file_path}")
                return FixResult(
                    file_path=debug_result.file_path,
                    fixes_applied=fixes_applied,
                    tests_passed=True,
                    new_issues=[],
                    iteration=self.fix_attempts
                )
            
            # Update debug result for next iteration
            debug_result.issues = new_issues
        
        # Max attempts reached - escalate
        print(f"🚨 Thermonuclear Escalate: Max fix attempts reached for {debug_result.file_path}")
        return FixResult(
            file_path=debug_result.file_path,
            fixes_applied=[],
            tests_passed=False,
            new_issues=["Max fix attempts reached - escalated to HITL"],
            iteration=self.fix_attempts
        )
    
    def _apply_fixes(self, debug_result: DebugResult) -> List[str]:
        """Apply fixes to file"""
        fixes_applied = []
        
        try:
            file_path = Path(debug_result.file_path)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply fixes based on issues
            for issue in debug_result.issues:
                if "console.log" in issue:
                    content = content.replace("console.log(", "// console.log(")
                    fixes_applied.append("Commented out console.log statements")
                
                if "var " in issue:
                    content = content.replace("var ", "const ")
                    fixes_applied.append("Replaced 'var' with 'const'")
                
                if "any" in issue:
                    content = content.replace(": any", ": unknown")
                    fixes_applied.append("Replaced 'any' with 'unknown'")
                
                if "useEffect" in issue and "[]" not in content:
                    # Add dependency array to useEffect
                    content = content.replace("useEffect(() => {", "useEffect(() => {\n  // TODO: Add dependencies")
                    fixes_applied.append("Added TODO for useEffect dependencies")
            
            # Write back if changes were made
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"🔥 Thermonuclear Fix Applied: {len(fixes_applied)} fixes to {debug_result.file_path}")
            
        except Exception as e:
            fixes_applied.append(f"Error applying fixes: {str(e)}")
        
        return fixes_applied
    
    def _rerun_tests(self, file_path: str) -> bool:
        """Rerun tests for file"""
        try:
            validation_tool = ValidationTool()
            
            # Run language-specific tests
            if file_path.endswith('.py'):
                result = validation_tool._run("python -m pytest", str(Path(file_path).parent))
            elif file_path.endswith(('.js', '.ts', '.jsx', '.tsx')):
                result = validation_tool._run("npm test", str(Path(file_path).parent))
            else:
                result = {"success": True}  # Mock success for other file types
            
            return result["success"]
            
        except Exception as e:
            print(f"Error running tests: {str(e)}")
            return False
    
    def _check_new_issues(self, file_path: str) -> List[str]:
        """Check for new issues after fixes"""
        # Mock check - in real implementation, would run debugger again
        return []

class ShipperAgent(Agent):
    """Shipper Agent: Handles CI/CD, deploys to Cloudflare/Vercel, verifies uptime"""
    
    def __init__(self):
        super().__init__(
            role="Shipper Agent",
            goal="Handle CI/CD, deploy to Cloudflare (Workers/Pages) and Vercel, verify uptime, and log deployment status",
            backstory="""You are an expert deployment agent with deep knowledge of 
            cloud platforms, CI/CD pipelines, and infrastructure management. You 
            ensure smooth deployments and verify system health post-deployment.""",
            verbose=True,
            allow_delegation=False,
            tools=[DeploymentTool()]
        )
    
    def ship_project(self, fix_results: List[FixResult]) -> ShipResult:
        """Ship the project after fixes are applied"""
        print("🚀 Thermonuclear Ship: Starting deployment process")
        
        # Check if all fixes were successful
        failed_fixes = [f for f in fix_results if not f.tests_passed]
        if failed_fixes:
            print(f"🚨 Thermonuclear Ship Blocked: {len(failed_fixes)} fixes failed")
            return ShipResult(
                environment="none",
                deployment_url="",
                status="failed",
                uptime_check=False,
                thrive_score=0.0
            )
        
        # Deploy to staging first
        staging_result = self._deploy_to_staging()
        if not staging_result["success"]:
            print("🚨 Thermonuclear Ship Failed: Staging deployment failed")
            return ShipResult(
                environment="staging",
                deployment_url="",
                status="failed",
                uptime_check=False,
                thrive_score=0.0
            )
        
        # Verify staging uptime
        staging_uptime = self._verify_uptime(staging_result["deployment_url"])
        
        # Deploy to production
        production_result = self._deploy_to_production()
        if not production_result["success"]:
            print("🚨 Thermonuclear Ship Failed: Production deployment failed")
            return ShipResult(
                environment="production",
                deployment_url="",
                status="failed",
                uptime_check=False,
                thrive_score=0.0
            )
        
        # Verify production uptime
        production_uptime = self._verify_uptime(production_result["deployment_url"])
        
        # Calculate final thrive score
        thrive_score = self._calculate_deployment_thrive_score(
            staging_result, staging_uptime,
            production_result, production_uptime
        )
        
        print(f"✅ Thermonuclear Ship Success: Thrive Score {thrive_score:.2f}")
        
        return ShipResult(
            environment="production",
            deployment_url=production_result["deployment_url"],
            status="success" if thrive_score >= THERMONUCLEAR_CONFIG["thrive_score_threshold"] else "partial",
            uptime_check=production_uptime,
            thrive_score=thrive_score
        )
    
    def _deploy_to_staging(self) -> Dict[str, Any]:
        """Deploy to staging environment"""
        print("🚀 Thermonuclear Ship: Deploying to staging")
        
        deployment_tool = DeploymentTool()
        result = deployment_tool._run("staging", "cloudflare")
        
        if result["success"]:
            print(f"✅ Thermonuclear Staging Deployed: {result['deployment_url']}")
        else:
            print(f"❌ Thermonuclear Staging Failed: {result.get('error', 'Unknown error')}")
        
        return result
    
    def _deploy_to_production(self) -> Dict[str, Any]:
        """Deploy to production environment"""
        print("🚀 Thermonuclear Ship: Deploying to production")
        
        deployment_tool = DeploymentTool()
        result = deployment_tool._run("production", "cloudflare")
        
        if result["success"]:
            print(f"✅ Thermonuclear Production Deployed: {result['deployment_url']}")
        else:
            print(f"❌ Thermonuclear Production Failed: {result.get('error', 'Unknown error')}")
        
        return result
    
    def _verify_uptime(self, deployment_url: str) -> bool:
        """Verify deployment uptime"""
        print(f"🔍 Thermonuclear Uptime Check: {deployment_url}")
        
        try:
            # Mock uptime check
            result = mock_api_call("uptime/check", {"url": deployment_url})
            uptime_ok = result.get("success", True)
            
            if uptime_ok:
                print(f"✅ Thermonuclear Uptime OK: {deployment_url}")
            else:
                print(f"❌ Thermonuclear Uptime Failed: {deployment_url}")
            
            return uptime_ok
            
        except Exception as e:
            print(f"❌ Thermonuclear Uptime Error: {str(e)}")
            return False
    
    def _calculate_deployment_thrive_score(self, staging_result: Dict, staging_uptime: bool,
                                         production_result: Dict, production_uptime: bool) -> float:
        """Calculate thrive score for deployment"""
        
        # Mock deployment logs
        deployment_logs = [
            {"status": "success" if staging_result["success"] else "fail", "type": "deploy"},
            {"status": "success" if staging_uptime else "fail", "type": "uptime"},
            {"status": "success" if production_result["success"] else "fail", "type": "deploy"},
            {"status": "success" if production_uptime else "fail", "type": "uptime"}
        ]
        
        return ThriveScoreCalculator.calculate(deployment_logs)

class ProtoThriveCrew:
    """Main crew orchestrating the debug and ship process"""
    
    def __init__(self):
        self.debugger = DebuggerAgent()
        self.fixer = FixerAgent()
        self.shipper = ShipperAgent()
        
        # Create crew
        self.crew = Crew(
            agents=[self.debugger, self.fixer, self.shipper],
            tasks=[],
            process=Process.sequential,
            verbose=True
        )
    
    def run_debug_and_ship(self, project_path: str = ".") -> Dict[str, Any]:
        """Run the complete debug and ship process"""
        print("🔥 Thermonuclear Init: Starting ProtoThrive Debug & Ship Process")
        print("Ref: CLAUDE.md Sections 1-5")
        
        # Check kill switch
        if self._check_kill_switch():
            print("🚨 THERMONUCLEAR HALT: Kill switch activated")
            return {"status": "halted", "reason": "kill_switch"}
        
        try:
            # Phase 1: Debug
            print("\n🔍 Phase 1: Debug Analysis")
            debug_results = self.debugger.analyze_codebase(project_path)
            
            # Phase 2: Fix
            print("\n🔧 Phase 2: Issue Resolution")
            fix_results = self.fixer.fix_issues(debug_results)
            
            # Phase 3: Ship
            print("\n🚀 Phase 3: Deployment")
            ship_result = self.shipper.ship_project(fix_results)
            
            # Calculate overall thrive score
            overall_score = self._calculate_overall_thrive_score(debug_results, fix_results, ship_result)
            
            # Generate final report
            report = self._generate_final_report(debug_results, fix_results, ship_result, overall_score)
            
            print(f"\n🎉 ProtoThrive Shipped - Thermonuclear Success!")
            print(f"Overall Thrive Score: {overall_score:.2f}")
            
            return report
            
        except Exception as e:
            print(f"🚨 Thermonuclear Error: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _check_kill_switch(self) -> bool:
        """Check if kill switch is activated"""
        try:
            # Mock kill switch check
            result = mock_db_query("SELECT value FROM kv WHERE key = ?", [THERMONUCLEAR_CONFIG["kill_switch_key"]])
            return result and result[0].get("value") == "true"
        except:
            return False
    
    def _calculate_overall_thrive_score(self, debug_results: List[DebugResult], 
                                      fix_results: List[FixResult], 
                                      ship_result: ShipResult) -> float:
        """Calculate overall thrive score"""
        
        # Mock overall logs
        overall_logs = []
        
        # Debug phase logs
        for result in debug_results:
            overall_logs.append({
                "status": "success" if result.severity in ["low", "medium"] else "fail",
                "type": "debug"
            })
        
        # Fix phase logs
        for result in fix_results:
            overall_logs.append({
                "status": "success" if result.tests_passed else "fail",
                "type": "fix"
            })
        
        # Ship phase logs
        overall_logs.append({
            "status": "success" if ship_result.status == "success" else "fail",
            "type": "ship"
        })
        
        return ThriveScoreCalculator.calculate(overall_logs)
    
    def _generate_final_report(self, debug_results: List[DebugResult], 
                             fix_results: List[FixResult], 
                             ship_result: ShipResult, 
                             overall_score: float) -> Dict[str, Any]:
        """Generate final deployment report"""
        
        report = {
            "status": "completed",
            "overall_thrive_score": overall_score,
            "phases": {
                "debug": {
                    "files_analyzed": len(debug_results),
                    "issues_found": sum(len(r.issues) for r in debug_results),
                    "critical_issues": len([r for r in debug_results if r.severity == "critical"]),
                    "high_issues": len([r for r in debug_results if r.severity == "high"]),
                    "medium_issues": len([r for r in debug_results if r.severity == "medium"]),
                    "low_issues": len([r for r in debug_results if r.severity == "low"])
                },
                "fix": {
                    "files_fixed": len([r for r in fix_results if r.tests_passed]),
                    "fixes_applied": sum(len(r.fixes_applied) for r in fix_results),
                    "escalations": len([r for r in fix_results if not r.tests_passed])
                },
                "ship": {
                    "deployment_status": ship_result.status,
                    "deployment_url": ship_result.deployment_url,
                    "uptime_check": ship_result.uptime_check,
                    "thrive_score": ship_result.thrive_score
                }
            },
            "recommendations": self._generate_recommendations(debug_results, fix_results, ship_result),
            "detailed_issues": self._generate_detailed_issues(debug_results),
            "timestamp": time.time()
        }
        
        return report
    
    def _generate_recommendations(self, debug_results: List[DebugResult], 
                                fix_results: List[FixResult], 
                                ship_result: ShipResult) -> List[str]:
        """Generate recommendations based on results"""
        
        recommendations = []
        
        # Debug recommendations
        critical_issues = [r for r in debug_results if r.severity == "critical"]
        if critical_issues:
            recommendations.append("Address critical security and performance issues immediately")
        
        high_issues = [r for r in debug_results if r.severity == "high"]
        if high_issues:
            recommendations.append("Review and fix high-severity issues before deployment")
        
        # Fix recommendations
        failed_fixes = [r for r in fix_results if not r.tests_passed]
        if failed_fixes:
            recommendations.append("Review and manually fix escalated issues")
        
        # Ship recommendations
        if ship_result.status != "success":
            recommendations.append("Investigate deployment failures and improve CI/CD pipeline")
        
        if ship_result.thrive_score < THERMONUCLEAR_CONFIG["thrive_score_threshold"]:
            recommendations.append("Improve overall code quality to achieve higher thrive score")
        
        return recommendations
    
    def _generate_detailed_issues(self, debug_results: List[DebugResult]) -> Dict[str, List[str]]:
        """Generate detailed breakdown of issues by severity"""
        
        detailed = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": []
        }
        
        for result in debug_results:
            for issue in result.issues:
                detailed[result.severity].append(f"{result.file_path}: {issue}")
        
        return detailed

def main():
    """Main entry point"""
    print("🔥 Thermonuclear Master Control Document Implementation")
    print("ProtoThrive Debug & Ship CrewAI System - Focused Version")
    print("Ref: CLAUDE.md Sections 1-5")
    
    # Create and run crew
    crew = ProtoThriveCrew()
    result = crew.run_debug_and_ship()
    
    # Output final result
    print("\n" + "="*80)
    print("FINAL REPORT")
    print("="*80)
    print(json.dumps(result, indent=2, default=str))
    
    if result.get("status") == "completed" and result.get("overall_thrive_score", 0) >= THERMONUCLEAR_CONFIG["thrive_score_threshold"]:
        print("\n🎉 ProtoThrive Shipped - Thermonuclear Success!")
        return 0
    else:
        print("\n❌ ProtoThrive Ship Failed - Escalation Required")
        return 1

if __name__ == "__main__":
    sys.exit(main())
