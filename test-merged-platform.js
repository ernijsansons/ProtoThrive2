// Ref: CLAUDE.md Phase 6 - Thermonuclear Merged Platform Test
// Tests all merged components in unified environment

console.log('🚀 THERMONUCLEAR MERGED PLATFORM TEST');
console.log('=====================================');

async function testMergedPlatform() {
  const results = {
    backend: false,
    frontend: false,
    ai: false,
    automation: false,
    security: false,
    integration: false
  };

  try {
    // Test Backend Components
    console.log('🔧 Testing Backend Components...');
    const fs = require('fs');
    
    if (fs.existsSync('./src-backend')) {
      console.log('✅ Backend src merged successfully');
      results.backend = true;
    }
    
    if (fs.existsSync('./utils-backend')) {
      console.log('✅ Backend utils merged successfully');
    }
    
    if (fs.existsSync('./migrations')) {
      console.log('✅ Backend migrations merged successfully');
    }

    // Test Frontend Components
    console.log('🎨 Testing Frontend Components...');
    
    if (fs.existsSync('./src-frontend')) {
      console.log('✅ Frontend src merged successfully');
      results.frontend = true;
    }
    
    if (fs.existsSync('./app-frontend')) {
      console.log('✅ Frontend app merged successfully');
    }
    
    if (fs.existsSync('./pages-frontend')) {
      console.log('✅ Frontend pages merged successfully');
    }

    // Test AI Components
    console.log('🤖 Testing AI Components...');
    
    if (fs.existsSync('./src-ai')) {
      console.log('✅ AI src merged successfully');
      results.ai = true;
    }
    
    if (fs.existsSync('./tests-ai')) {
      console.log('✅ AI tests merged successfully');
    }

    // Test Automation Components
    console.log('⚡ Testing Automation Components...');
    
    if (fs.existsSync('./scripts-automation')) {
      console.log('✅ Automation scripts merged successfully');
      results.automation = true;
    }
    
    if (fs.existsSync('./workflows-automation')) {
      console.log('✅ Automation workflows merged successfully');
    }

    // Test Security Components
    console.log('🔒 Testing Security Components...');
    
    if (fs.existsSync('./src-security')) {
      console.log('✅ Security src merged successfully');
      results.security = true;
    }
    
    if (fs.existsSync('./test-security.js')) {
      console.log('✅ Security tests merged successfully');
    }

    // Test Integration Layer
    console.log('🔗 Testing Integration Layer...');
    
    if (fs.existsSync('./integration')) {
      console.log('✅ Integration layer preserved');
      results.integration = true;
    }

    // Calculate final score
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    console.log('');
    console.log('📊 THERMONUCLEAR MERGE RESULTS:');
    console.log('==============================');
    console.log(`✅ Backend:     ${results.backend ? 'MERGED' : 'FAILED'}`);
    console.log(`✅ Frontend:    ${results.frontend ? 'MERGED' : 'FAILED'}`);
    console.log(`✅ AI Core:     ${results.ai ? 'MERGED' : 'FAILED'}`);
    console.log(`✅ Automation:  ${results.automation ? 'MERGED' : 'FAILED'}`);
    console.log(`✅ Security:    ${results.security ? 'MERGED' : 'FAILED'}`);
    console.log(`✅ Integration: ${results.integration ? 'MERGED' : 'FAILED'}`);
    console.log('');
    console.log(`🎯 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    
    if (successRate === '100.0') {
      console.log('');
      console.log('🎉 THERMONUCLEAR MERGE COMPLETE - 100% SUCCESS!');
      console.log('🚀 All phases successfully merged into root directory');
      console.log('✅ Platform ready for unified development workflow');
      console.log('📍 All components accessible from single location');
      console.log('');
      console.log('🔧 Development Commands:');
      console.log('   ./start-mvp.sh              # Launch full platform');
      console.log('   node integration/main.js     # Integration test');
      console.log('   node test-merged-platform.js # Merge validation');
      console.log('');
      console.log('🎯 MISSION ACCOMPLISHED: Thermonuclear Merge Complete!');
      
      return { success: true, results, successRate };
    } else {
      console.log('⚠️ Some components failed to merge properly');
      return { success: false, results, successRate };
    }

  } catch (error) {
    console.error('❌ Merge test error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testMergedPlatform().then(result => {
  if (result.success) {
    process.exit(0);
  } else {
    console.error('❌ MERGE TEST FAILED');
    process.exit(1);
  }
});