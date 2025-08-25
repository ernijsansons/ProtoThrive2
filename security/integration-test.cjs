// Ref: CLAUDE.md - Integration Test Script
// Verifies cross-phase integration points

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 THERMONUCLEAR INTEGRATION TEST - Verifying all cross-phase connections\n');

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Test 1: Frontend-Backend Integration
console.log('1. Testing Frontend → Backend Integration...');
try {
  // Check if frontend calls backend API with proper mock
  const frontendCode = require('fs').readFileSync(
    path.join(__dirname, '../frontend/src/pages/index.tsx'), 
    'utf8'
  );
  
  if (frontendCode.includes('/api/roadmaps/') && frontendCode.includes('mockFetch')) {
    // Verify mockFetch handles the pattern
    const { mockFetch } = require('../utils/mocks');
    const response = mockFetch('/api/roadmaps/rm-thermo-1');
    
    response.then(async (res) => {
      const data = await res.json();
      if (data.json_graph && data.thrive_score !== undefined) {
        results.passed.push('✅ Frontend-Backend: mockFetch returns proper roadmap data');
      } else {
        results.failed.push('❌ Frontend-Backend: mockFetch missing roadmap fields');
      }
    });
  }
} catch (e) {
  results.failed.push(`❌ Frontend-Backend: ${e.message}`);
}

// Test 2: AI Orchestrator Database Integration
console.log('2. Testing AI Orchestrator → Database Integration...');
try {
  // Python AI orchestrator should use mock_db_query
  const orchestratorCode = require('fs').readFileSync(
    path.join(__dirname, '../ai-core/src/orchestrator.py'),
    'utf8'
  );
  
  if (orchestratorCode.includes('mock_db_query') && 
      orchestratorCode.includes('INSERT INTO agent_logs') &&
      orchestratorCode.includes('UPDATE roadmaps SET thrive_score')) {
    results.passed.push('✅ AI-Database: Orchestrator logs to database and updates score');
  } else {
    results.failed.push('❌ AI-Database: Orchestrator missing database integration');
  }
} catch (e) {
  results.failed.push(`❌ AI-Database: ${e.message}`);
}

// Test 3: Automation Workflow Integration
console.log('3. Testing Automation → AI/Backend Integration...');
try {
  const automationJson = require('../automation/workflows/automation.json');
  
  // Check if workflow has proper nodes
  const hasPlanner = automationJson.nodes.some(n => n.name === 'Mock Planner');
  const hasCoder = automationJson.nodes.some(n => n.name === 'Mock Coder');
  const hasThrive = automationJson.nodes.some(n => n.name === 'Calc Thrive');
  const hasDBUpdate = automationJson.nodes.some(n => n.name === 'Update DB Mock');
  
  if (hasPlanner && hasCoder && hasThrive && hasDBUpdate) {
    results.passed.push('✅ Automation: Workflow has all required nodes');
  } else {
    results.failed.push('❌ Automation: Workflow missing critical nodes');
  }
  
  // Note: Real AI orchestrator integration would require n8n Python node
  results.warnings.push('⚠️  Automation: Uses mocks instead of real orchestrator.py (requires n8n Python node)');
} catch (e) {
  results.failed.push(`❌ Automation: ${e.message}`);
}

// Test 4: Security Auth in Backend
console.log('4. Testing Security Auth → Backend Integration...');
try {
  const backendCode = require('fs').readFileSync(
    path.join(__dirname, '../backend/src/index.ts'),
    'utf8'
  );
  
  if (backendCode.includes('validateJwt') && 
      backendCode.includes('app.use(\'/api/*\', validateJwt)')) {
    results.passed.push('✅ Security-Backend: Auth middleware applied to all API routes');
  } else {
    results.failed.push('❌ Security-Backend: Auth middleware not properly integrated');
  }
} catch (e) {
  results.failed.push(`❌ Security-Backend: ${e.message}`);
}

// Test 5: Cost Checking in AI Router
console.log('5. Testing Cost Checking → AI Router Integration...');
try {
  const routerCode = require('fs').readFileSync(
    path.join(__dirname, '../ai-core/src/router.py'),
    'utf8'
  );
  
  if (routerCode.includes('estimate_cost') && 
      routerCode.includes('route_task')) {
    results.passed.push('✅ Cost-AI: Router has cost estimation for model selection');
    
    // Check if backend also has budget middleware
    const backendHasBudget = require('fs').readFileSync(
      path.join(__dirname, '../backend/src/index.ts'),
      'utf8'
    ).includes('checkBudgetMiddleware');
    
    if (backendHasBudget) {
      results.passed.push('✅ Cost-Backend: Budget middleware integrated');
    }
  } else {
    results.failed.push('❌ Cost-AI: Router missing cost estimation');
  }
} catch (e) {
  results.failed.push(`❌ Cost checking: ${e.message}`);
}

// Test 6: Error Handling Consistency
console.log('6. Testing Error Handling Consistency...');
try {
  // Check error patterns across modules
  const errorPatterns = {
    backend: /code: ['"]([A-Z]+-\d{3})['"]/, // e.g., AUTH-401
    security: /code:\s*['"]([A-Z]+-\d{3})['"]/, // e.g., BUDGET-429
  };
  
  const backendErrors = require('fs').readFileSync(
    path.join(__dirname, '../backend/src/index.ts'),
    'utf8'
  ).match(errorPatterns.backend);
  
  const securityErrors = require('fs').readFileSync(
    path.join(__dirname, './src/cost.js'),
    'utf8'
  ).match(errorPatterns.security);
  
  if (backendErrors && securityErrors) {
    results.passed.push('✅ Error Handling: Consistent error code format across modules');
  } else {
    results.warnings.push('⚠️  Error Handling: Inconsistent error formats detected');
  }
} catch (e) {
  results.failed.push(`❌ Error handling: ${e.message}`);
}

// Test 7: Mock Utilities Consistency
console.log('7. Testing Mock Utilities Consistency...');
try {
  const { mockDbQuery, calculateThriveScore, checkBudget } = require('../utils/mocks');
  
  // Test mock functions work
  const dbResult = mockDbQuery('SELECT * FROM roadmaps', []);
  const thriveResult = calculateThriveScore([
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'code' }
  ]);
  
  if (dbResult.success && thriveResult.score > 0) {
    results.passed.push('✅ Mocks: Unified mock utilities working correctly');
  } else {
    results.failed.push('❌ Mocks: Mock utilities returning invalid data');
  }
} catch (e) {
  results.failed.push(`❌ Mock utilities: ${e.message}`);
}

// Final Report
console.log('\n' + '='.repeat(60));
console.log('THERMONUCLEAR INTEGRATION TEST RESULTS');
console.log('='.repeat(60));

console.log('\n✅ PASSED:', results.passed.length);
results.passed.forEach(r => console.log('  ', r));

console.log('\n⚠️  WARNINGS:', results.warnings.length);
results.warnings.forEach(r => console.log('  ', r));

console.log('\n❌ FAILED:', results.failed.length);
results.failed.forEach(r => console.log('  ', r));

const totalTests = results.passed.length + results.failed.length;
const successRate = ((results.passed.length / totalTests) * 100).toFixed(1);

console.log('\n' + '='.repeat(60));
console.log(`SUCCESS RATE: ${successRate}% (${results.passed.length}/${totalTests})`);
console.log('='.repeat(60));

// Exit with appropriate code
if (results.failed.length > 0) {
  console.log('\n❌ Integration issues detected. Please fix the failures above.');
  process.exit(1);
} else {
  console.log('\n✅ All critical integration points verified!');
  console.log('🚀 THERMONUCLEAR INTEGRATION: System ready for deployment');
  process.exit(0);
}