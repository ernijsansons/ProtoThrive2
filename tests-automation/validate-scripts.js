// Ref: CLAUDE.md Terminal 4 Phase 4 - Scripts Validation
// Thermonuclear Script Validator

const fs = require('fs');
const path = require('path');

console.log('Thermonuclear Scripts Validation: Starting');

try {
  // Test deploy_trigger.js
  console.log('\n--- Testing deploy_trigger.js ---');
  const deployScript = require('../scripts/deploy_trigger.js');
  
  // Validate exports
  if (typeof deployScript.deploy !== 'function') {
    throw new Error('deploy_trigger.js must export deploy function');
  }
  if (typeof deployScript.deployWithRetry !== 'function') {
    throw new Error('deploy_trigger.js must export deployWithRetry function');
  }
  
  console.log('✓ deploy_trigger.js exports validated');
  
  // Test progress.js
  console.log('\n--- Testing progress.js ---');
  const progressScript = require('../scripts/progress.js');
  
  // Validate exports
  if (typeof progressScript.calcThrive !== 'function') {
    throw new Error('progress.js must export calcThrive function');
  }
  if (typeof progressScript.calculateProgress !== 'function') {
    throw new Error('progress.js must export calculateProgress function');
  }
  if (typeof progressScript.generateProgressReport !== 'function') {
    throw new Error('progress.js must export generateProgressReport function');
  }
  
  console.log('✓ progress.js exports validated');
  
  // Test calcThrive with spec data
  console.log('\n--- Testing Thrive Score Calculation ---');
  const testLogs = [
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'code' },
    { status: 'fail', type: 'deploy' }
  ];
  
  const result = progressScript.calcThrive(testLogs);
  console.log('Thrive Score Result:', result);
  
  // Validate result structure
  if (typeof result.score !== 'number') {
    throw new Error('calcThrive must return score as number');
  }
  if (result.status !== 'neon' && result.status !== 'gray') {
    throw new Error('calcThrive must return status as "neon" or "gray"');
  }
  if (!result.components || typeof result.components !== 'object') {
    throw new Error('calcThrive must return components object');
  }
  
  // Validate expected score based on spec calculation
  // From spec: completion = 2/3*0.6 = 0.4, ui_polish = 1/3*0.3 = 0.1, 
  // risk = 1 - (1/3)*0.1 = 1 - 0.0333 = 0.0667
  // Total = 0.4 + 0.1 + 0.0667 = 0.567 ≈ 0.57
  const expectedScore = 0.57;
  const tolerance = 0.01;
  if (Math.abs(result.score - expectedScore) > tolerance) {
    throw new Error(`Expected score ~${expectedScore}, got ${result.score}`);
  }
  
  console.log('✓ Thrive score calculation correct');
  
  // Test error handling
  console.log('\n--- Testing Error Handling ---');
  try {
    progressScript.calcThrive([]);
    throw new Error('calcThrive should throw on empty array');
  } catch (e) {
    if (!e.message.includes('PROGRESS-400')) {
      throw new Error('calcThrive should throw PROGRESS-400 error on empty array');
    }
    console.log('✓ Empty array error handling correct');
  }
  
  try {
    progressScript.calcThrive('invalid');
    throw new Error('calcThrive should throw on invalid input');
  } catch (e) {
    if (!e.message.includes('PROGRESS-400')) {
      throw new Error('calcThrive should throw PROGRESS-400 error on invalid input');
    }
    console.log('✓ Invalid input error handling correct');
  }
  
  console.log('\nThermonuclear Checkpoint: All script validations passed');
  console.log('Scripts are functioning correctly per specifications');
  
} catch (error) {
  console.error('Thermonuclear Validation Error:', error.message);
  process.exit(1);
}