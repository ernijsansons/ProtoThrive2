// Integration Test Suite - Loop 2 Validation
// Ref: CLAUDE.md Integration Specialist - Cross-Phase Compatibility Analysis

const fs = require('fs');
const path = require('path');

class IntegrationValidator {
  constructor() {
    this.testResults = {
      apiContracts: [],
      dataFlow: [],
      security: [],
      automation: [],
      crossPhase: []
    };
    this.errors = [];
    this.validationScore = 0;
  }

  log(category, test, status, details = '') {
    const result = {
      test,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults[category].push(result);
    console.log(`[${category.toUpperCase()}] ${test}: ${status} ${details ? `- ${details}` : ''}`);
  }

  async validatePhase1Backend() {
    console.log('\n=== PHASE 1 BACKEND VALIDATION ===');
    
    // Check if backend files exist
    const backendFiles = [
      'backend/src/index.ts',
      'backend/utils/db.ts',
      'backend/utils/validation.ts',
      'backend/migrations/001_init.sql',
      'backend/wrangler.toml'
    ];
    
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        this.log('apiContracts', `Backend file exists: ${file}`, 'PASS');
      } else {
        this.log('apiContracts', `Backend file missing: ${file}`, 'FAIL');
        this.errors.push(`Missing backend file: ${file}`);
      }
    }

    // Validate API endpoints structure
    try {
      const indexContent = fs.readFileSync('backend/src/index.ts', 'utf8');
      
      // Check for required endpoints
      const requiredEndpoints = [
        'app.get(\'/roadmaps/:id\'',
        'app.post(\'/roadmaps\'',
        'app.get(\'/snippets\'',
        'app.post(\'/snippets\'',
        '/graphql'
      ];
      
      for (const endpoint of requiredEndpoints) {
        if (indexContent.includes(endpoint)) {
          this.log('apiContracts', `Endpoint found: ${endpoint}`, 'PASS');
        } else {
          this.log('apiContracts', `Endpoint missing: ${endpoint}`, 'FAIL');
          this.errors.push(`Missing endpoint: ${endpoint}`);
        }
      }

      // Check for CLAUDE.md dummy data consistency
      if (indexContent.includes('uuid-thermo-1') && indexContent.includes('vibe_coder')) {
        this.log('dataFlow', 'Backend uses CLAUDE.md dummy data', 'PASS');
      } else {
        this.log('dataFlow', 'Backend dummy data inconsistent', 'FAIL');
        this.errors.push('Backend not using CLAUDE.md dummy data');
      }

    } catch (error) {
      this.log('apiContracts', 'Backend index.ts validation', 'FAIL', error.message);
      this.errors.push(`Backend validation error: ${error.message}`);
    }
  }

  async validatePhase2Frontend() {
    console.log('\n=== PHASE 2 FRONTEND VALIDATION ===');
    
    // Check frontend structure
    const frontendFiles = [
      'frontend/src/store.ts',
      'frontend/src/components/MagicCanvas.tsx',
      'frontend/src/components/InsightsPanel.tsx',
      'frontend/src/pages/index.tsx',
      'frontend/src/pages/_app.tsx'
    ];
    
    for (const file of frontendFiles) {
      if (fs.existsSync(file)) {
        this.log('apiContracts', `Frontend file exists: ${file}`, 'PASS');
      } else {
        this.log('apiContracts', `Frontend file missing: ${file}`, 'FAIL');
        this.errors.push(`Missing frontend file: ${file}`);
      }
    }

    // Validate store integration
    try {
      const storeContent = fs.readFileSync('frontend/src/store.ts', 'utf8');
      
      // Check for API integration readiness
      if (storeContent.includes('fetchRoadmap') && storeContent.includes('createRoadmap')) {
        this.log('dataFlow', 'Store has API integration methods', 'PASS');
      } else {
        this.log('dataFlow', 'Store missing API integration', 'FAIL');
        this.errors.push('Store missing API integration methods');
      }

      // Check for dummy data consistency
      if (storeContent.includes('Thermo Start') && storeContent.includes('uuid-thermo')) {
        this.log('dataFlow', 'Frontend uses CLAUDE.md dummy data', 'PASS');
      } else {
        this.log('dataFlow', 'Frontend dummy data inconsistent', 'FAIL');
        this.errors.push('Frontend not using CLAUDE.md dummy data');
      }

      // Check for required state management
      const requiredState = ['nodes', 'edges', 'mode', 'thriveScore', 'toggleMode'];
      for (const state of requiredState) {
        if (storeContent.includes(state)) {
          this.log('crossPhase', `Store state: ${state}`, 'PASS');
        } else {
          this.log('crossPhase', `Store state missing: ${state}`, 'FAIL');
          this.errors.push(`Store missing state: ${state}`);
        }
      }

    } catch (error) {
      this.log('apiContracts', 'Frontend store validation', 'FAIL', error.message);
      this.errors.push(`Frontend validation error: ${error.message}`);
    }
  }

  async validatePhase3AICore() {
    console.log('\n=== PHASE 3 AI CORE VALIDATION ===');
    
    const aiFiles = [
      'ai-core/src/orchestrator.py',
      'ai-core/src/router.py',
      'ai-core/src/rag.py',
      'ai-core/src/agents.py',
      'ai-core/src/cache.py'
    ];
    
    for (const file of aiFiles) {
      if (fs.existsSync(file)) {
        this.log('crossPhase', `AI file exists: ${file}`, 'PASS');
      } else {
        this.log('crossPhase', `AI file missing: ${file}`, 'FAIL');
        this.errors.push(`Missing AI file: ${file}`);
      }
    }

    // Validate orchestrator integration
    try {
      const orchestratorContent = fs.readFileSync('ai-core/src/orchestrator.py', 'utf8');
      
      // Check for agent pipeline
      const requiredAgents = ['PlannerAgent', 'CoderAgent', 'AuditorAgent'];
      for (const agent of requiredAgents) {
        if (orchestratorContent.includes(agent)) {
          this.log('crossPhase', `Agent found: ${agent}`, 'PASS');
        } else {
          this.log('crossPhase', `Agent missing: ${agent}`, 'FAIL');
          this.errors.push(`Missing agent: ${agent}`);
        }
      }

      // Check for dummy data usage
      if (orchestratorContent.includes('dummy_json_graph') && orchestratorContent.includes('Thermo')) {
        this.log('dataFlow', 'AI Core uses CLAUDE.md dummy data', 'PASS');
      } else {
        this.log('dataFlow', 'AI Core dummy data inconsistent', 'FAIL');
        this.errors.push('AI Core not using CLAUDE.md dummy data');
      }

    } catch (error) {
      this.log('crossPhase', 'AI Core validation', 'FAIL', error.message);
      this.errors.push(`AI Core validation error: ${error.message}`);
    }
  }

  async validatePhase4Automation() {
    console.log('\n=== PHASE 4 AUTOMATION VALIDATION ===');
    
    const automationFiles = [
      'automation/workflows/automation.json',
      'automation/scripts/deploy_trigger.js',
      'automation/scripts/progress.js'
    ];
    
    for (const file of automationFiles) {
      if (fs.existsSync(file)) {
        this.log('automation', `Automation file exists: ${file}`, 'PASS');
      } else {
        this.log('automation', `Automation file missing: ${file}`, 'FAIL');
        this.errors.push(`Missing automation file: ${file}`);
      }
    }

    // Validate n8n workflow
    try {
      const workflowContent = fs.readFileSync('automation/workflows/automation.json', 'utf8');
      const workflow = JSON.parse(workflowContent);
      
      // Check for required nodes
      const requiredNodes = ['Trigger', 'Mock Planner', 'Mock Coder', 'Mock Auditor', 'Calc Thrive'];
      const nodeNames = workflow.nodes.map(node => node.name);
      
      for (const nodeName of requiredNodes) {
        if (nodeNames.includes(nodeName)) {
          this.log('automation', `Workflow node: ${nodeName}`, 'PASS');
        } else {
          this.log('automation', `Workflow node missing: ${nodeName}`, 'FAIL');
          this.errors.push(`Missing workflow node: ${nodeName}`);
        }
      }

      // Check for Thrive Score calculation
      const calcThriveNode = workflow.nodes.find(node => node.name === 'Calc Thrive');
      if (calcThriveNode && calcThriveNode.parameters.functionCode.includes('0.6') && 
          calcThriveNode.parameters.functionCode.includes('0.3')) {
        this.log('dataFlow', 'Workflow uses correct Thrive Score formula', 'PASS');
      } else {
        this.log('dataFlow', 'Workflow Thrive Score formula incorrect', 'FAIL');
        this.errors.push('Workflow not using correct Thrive Score formula');
      }

    } catch (error) {
      this.log('automation', 'Automation workflow validation', 'FAIL', error.message);
      this.errors.push(`Automation validation error: ${error.message}`);
    }
  }

  async validatePhase5Security() {
    console.log('\n=== PHASE 5 SECURITY VALIDATION ===');
    
    const securityFiles = [
      'security/src/vault.js',
      'security/src/auth.js',
      'security/src/monitor.js',
      'security/src/cost.js',
      'security/src/compliance.js'
    ];
    
    for (const file of securityFiles) {
      if (fs.existsSync(file)) {
        this.log('security', `Security file exists: ${file}`, 'PASS');
      } else {
        this.log('security', `Security file missing: ${file}`, 'FAIL');
        this.errors.push(`Missing security file: ${file}`);
      }
    }

    // Validate vault integration
    try {
      const vaultContent = fs.readFileSync('security/src/vault.js', 'utf8');
      
      // Check for mock keys matching CLAUDE.md
      if (vaultContent.includes('mock_kimi_thermo') && vaultContent.includes('mock_claude_thermo')) {
        this.log('security', 'Vault uses CLAUDE.md mock keys', 'PASS');
      } else {
        this.log('security', 'Vault mock keys inconsistent', 'FAIL');
        this.errors.push('Vault not using CLAUDE.md mock keys');
      }

      // Check for error codes
      if (vaultContent.includes('VAULT-404')) {
        this.log('security', 'Vault uses custom error codes', 'PASS');
      } else {
        this.log('security', 'Vault missing error codes', 'FAIL');
        this.errors.push('Vault missing custom error codes');
      }

    } catch (error) {
      this.log('security', 'Security validation', 'FAIL', error.message);
      this.errors.push(`Security validation error: ${error.message}`);
    }
  }

  async validateCrossPhaseIntegration() {
    console.log('\n=== CROSS-PHASE INTEGRATION VALIDATION ===');
    
    // Validate API contract consistency between frontend and backend
    try {
      const backendContent = fs.readFileSync('backend/src/index.ts', 'utf8');
      const frontendContent = fs.readFileSync('frontend/src/store.ts', 'utf8');
      
      // Check if frontend API calls match backend endpoints
      if (backendContent.includes('/roadmaps/:id') && frontendContent.includes('/roadmaps/')) {
        this.log('crossPhase', 'API endpoints match between frontend/backend', 'PASS');
      } else {
        this.log('crossPhase', 'API endpoints mismatch', 'FAIL');
        this.errors.push('Frontend/Backend API endpoints not aligned');
      }

      // Check authentication flow
      if (backendContent.includes('validateJwt') && frontendContent.includes('Authorization')) {
        this.log('crossPhase', 'Authentication flow consistent', 'PASS');
      } else {
        this.log('crossPhase', 'Authentication flow inconsistent', 'FAIL');
        this.errors.push('Authentication not properly integrated');
      }

    } catch (error) {
      this.log('crossPhase', 'Cross-phase validation', 'FAIL', error.message);
      this.errors.push(`Cross-phase validation error: ${error.message}`);
    }

    // Validate dummy data consistency across all phases
    const dummyDataChecks = [
      { file: 'backend/src/index.ts', name: 'Backend' },
      { file: 'frontend/src/store.ts', name: 'Frontend' },
      { file: 'ai-core/src/orchestrator.py', name: 'AI Core' },
      { file: 'automation/workflows/automation.json', name: 'Automation' },
      { file: 'security/src/vault.js', name: 'Security' }
    ];

    let consistentData = 0;
    for (const check of dummyDataChecks) {
      try {
        if (fs.existsSync(check.file)) {
          const content = fs.readFileSync(check.file, 'utf8');
          if (content.includes('thermo') || content.includes('Thermo')) {
            this.log('dataFlow', `${check.name} uses consistent dummy data`, 'PASS');
            consistentData++;
          } else {
            this.log('dataFlow', `${check.name} dummy data inconsistent`, 'FAIL');
            this.errors.push(`${check.name} not using consistent dummy data`);
          }
        }
      } catch (error) {
        this.log('dataFlow', `${check.name} data check failed`, 'FAIL', error.message);
      }
    }

    if (consistentData >= 4) {
      this.log('dataFlow', 'Overall dummy data consistency', 'PASS', `${consistentData}/5 phases consistent`);
    } else {
      this.log('dataFlow', 'Overall dummy data consistency', 'FAIL', `Only ${consistentData}/5 phases consistent`);
      this.errors.push('Dummy data not consistent across phases');
    }
  }

  calculateValidationScore() {
    const totalTests = Object.values(this.testResults).flat().length;
    const passedTests = Object.values(this.testResults).flat().filter(test => test.status === 'PASS').length;
    
    this.validationScore = totalTests > 0 ? (passedTests / totalTests) : 0;
    
    console.log(`\n=== VALIDATION SCORE: ${(this.validationScore * 100).toFixed(1)}% ===`);
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    
    if (this.errors.length > 0) {
      console.log('\n=== CRITICAL ISSUES ===');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    return this.validationScore;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      validationScore: this.validationScore,
      deploymentReady: this.validationScore >= 0.8 && this.errors.length === 0,
      testResults: this.testResults,
      criticalIssues: this.errors,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('integration-validation-report.json', JSON.stringify(report, null, 2));
    console.log('\n=== INTEGRATION REPORT SAVED ===');
    console.log('File: integration-validation-report.json');
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.validationScore < 0.8) {
      recommendations.push('Address failing tests before deployment');
    }
    
    if (this.errors.length > 0) {
      recommendations.push('Fix all critical issues listed above');
    }
    
    const apiContractFails = this.testResults.apiContracts.filter(test => test.status === 'FAIL').length;
    if (apiContractFails > 0) {
      recommendations.push('Review API contracts between frontend and backend');
    }
    
    const dataFlowFails = this.testResults.dataFlow.filter(test => test.status === 'FAIL').length;
    if (dataFlowFails > 0) {
      recommendations.push('Ensure consistent dummy data across all phases');
    }
    
    const crossPhaseFails = this.testResults.crossPhase.filter(test => test.status === 'FAIL').length;
    if (crossPhaseFails > 0) {
      recommendations.push('Improve integration between phases');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All integration tests passed - System ready for deployment');
    }
    
    return recommendations;
  }

  async runFullValidation() {
    console.log('Starting Thermonuclear Integration Validation...\n');
    
    await this.validatePhase1Backend();
    await this.validatePhase2Frontend();
    await this.validatePhase3AICore();
    await this.validatePhase4Automation();
    await this.validatePhase5Security();
    await this.validateCrossPhaseIntegration();
    
    this.calculateValidationScore();
    const report = this.generateReport();
    
    console.log('\n=== DEPLOYMENT READINESS ===');
    if (report.deploymentReady) {
      console.log('✅ READY FOR DEPLOYMENT');
      console.log('All integration tests passed with score >= 80%');
    } else {
      console.log('❌ NOT READY FOR DEPLOYMENT');
      console.log('Critical issues must be resolved first');
    }
    
    return report;
  }
}

// Run the validation
const validator = new IntegrationValidator();
validator.runFullValidation().then(report => {
  console.log('\nThermonuclear Integration Validation Complete');
  process.exit(report.deploymentReady ? 0 : 1);
}).catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});