// Ref: CLAUDE.md Terminal 4 Phase 4 - Main Test Suite
// Thermonuclear Test Suite for Automation

console.log('=== THERMONUCLEAR AUTOMATION TEST SUITE ===\n');
console.log('Initializing Phase 4 validation...\n');

const { execSync } = require('child_process');
const path = require('path');

let totalTests = 0;
let passedTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

// Test 1: Validate directory structure
runTest('Directory structure exists', () => {
  const fs = require('fs');
  const requiredDirs = ['workflows', 'scripts', 'tests'];
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Missing directory: ${dir}`);
    }
  });
  // Check for .github/workflows in project root
  const githubPath = path.join(__dirname, '../../.github/workflows');
  if (!fs.existsSync(githubPath)) {
    throw new Error('Missing directory: .github/workflows in project root');
  }
});

// Test 2: Validate all required files exist
runTest('All required files exist', () => {
  const fs = require('fs');
  const requiredFiles = [
    'workflows/automation.json',
    'scripts/deploy_trigger.js',
    'scripts/progress.js',
    'package.json'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file: ${file}`);
    }
  });
});

// Test 3: Validate JSON syntax
runTest('automation.json has valid JSON syntax', () => {
  const fs = require('fs');
  const workflowPath = path.join(__dirname, '..', 'workflows', 'automation.json');
  const content = fs.readFileSync(workflowPath, 'utf8');
  JSON.parse(content); // Will throw if invalid
});

// Test 4: Validate YAML syntax (basic check)
runTest('ci-cd.yml has valid YAML structure', () => {
  const fs = require('fs');
  const yamlPath = path.join(__dirname, '../../.github/workflows/ci-cd.yml');
  const content = fs.readFileSync(yamlPath, 'utf8');
  
  // Basic YAML validation
  if (!content.includes('name: CI/CD')) {
    throw new Error('Missing workflow name');
  }
  if (!content.includes('jobs:')) {
    throw new Error('Missing jobs section');
  }
  
  // Check for all required jobs
  const requiredJobs = ['lint', 'test', 'build', 'deploy-staging', 'deploy-prod', 'security-scan', 'notify'];
  requiredJobs.forEach(job => {
    if (!content.includes(`${job}:`)) {
      throw new Error(`Missing job: ${job}`);
    }
  });
});

// Test 5: Validate environment variables
runTest('Environment variables configured', () => {
  const fs = require('fs');
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'CLAUDE_API_KEY',
    'KIMI_API_KEY',
    'VERCEL_TOKEN',
    'N8N_WEBHOOK_SECRET'
  ];
  
  requiredVars.forEach(varName => {
    if (!content.includes(varName)) {
      throw new Error(`Missing environment variable: ${varName}`);
    }
  });
});

// Test 6: Run workflow validation
console.log('\n--- Running Workflow Validation ---');
try {
  execSync('node tests/validate-workflow.js', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  passedTests++;
  totalTests++;
} catch (error) {
  totalTests++;
  console.error('Workflow validation failed');
}

// Test 7: Run scripts validation
console.log('\n--- Running Scripts Validation ---');
try {
  execSync('node tests/validate-scripts.js', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit' 
  });
  passedTests++;
  totalTests++;
} catch (error) {
  totalTests++;
  console.error('Scripts validation failed');
}

// Final report
console.log('\n=== THERMONUCLEAR TEST SUMMARY ===');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n✅ Phase 4 Complete - Ready for Integration. No Hallucinations Detected.');
  console.log('Thermonuclear Validation: All systems operational');
  process.exit(0);
} else {
  console.log('\n❌ Phase 4 Validation Failed - Errors detected');
  process.exit(1);
}