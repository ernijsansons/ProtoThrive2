// Ref: CLAUDE.md Terminal 4 Phase 4 - Progress Calculation Script
// Thermonuclear Thrive Score Calculator for ProtoThrive

/**
 * Calculate Thrive Score based on agent logs
 * Ref: CLAUDE.md Terminal 4 - Exact formula from spec
 * Formula: completion*0.6 + ui_polish*0.3 + risk*0.1
 * @param {Array<{status: string, type: string}>} logs - Array of agent execution logs
 * @returns {{score: number, status: string, components: object}}
 */
function calcThrive(logs) {
  try {
    console.log('Thermonuclear Thrive Score: Initializing calculation');

    // Validate input
    if (!Array.isArray(logs)) {
      throw new Error('PROGRESS-400: Invalid input - logs must be an array');
    }

    if (logs.length === 0) {
      throw new Error('PROGRESS-400: Invalid input - logs array cannot be empty');
    }

    // Validate each log entry
    logs.forEach((log, index) => {
      if (!log || typeof log !== 'object') {
        throw new Error(`PROGRESS-400: Invalid log entry at index ${index}`);
      }
      if (!log.status || typeof log.status !== 'string') {
        throw new Error(`PROGRESS-400: Missing or invalid status at index ${index}`);
      }
      if (!log.type || typeof log.type !== 'string') {
        throw new Error(`PROGRESS-400: Missing or invalid type at index ${index}`);
      }
    });

    console.log(`Thermonuclear Thrive Score: Processing ${logs.length} logs`);

    // Calculate completion component (60% weight)
    const successCount = logs.filter(log => log.status === 'success').length;
    const completion = (successCount / logs.length) * 0.6;
    console.log(`Completion: ${successCount}/${logs.length} successful = ${completion.toFixed(3)}`);

    // Calculate UI polish component (30% weight)
    const uiCount = logs.filter(log => log.type === 'ui').length;
    const ui_polish = (uiCount / logs.length) * 0.3;
    console.log(`UI Polish: ${uiCount}/${logs.length} UI tasks = ${ui_polish.toFixed(3)}`);

    // Calculate risk component (10% weight)
    const failCount = logs.filter(log => log.status === 'fail').length;
    const risk = 1 - (failCount / logs.length) * 0.1;
    console.log(`Risk Factor: ${failCount}/${logs.length} failures = ${risk.toFixed(3)}`);

    // Calculate final score
    const score = completion + ui_polish + risk;
    const status = score > 0.5 ? 'neon' : 'gray';

    console.log(`Thermonuclear Thrive Score: ${score.toFixed(2)} - Status: ${status}`);

    return {
      score: parseFloat(score.toFixed(2)),
      status: status,
      components: {
        completion: parseFloat(completion.toFixed(3)),
        ui_polish: parseFloat(ui_polish.toFixed(3)),
        risk: parseFloat(risk.toFixed(3))
      },
      metadata: {
        total_logs: logs.length,
        success_count: successCount,
        ui_count: uiCount,
        fail_count: failCount,
        calculated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Thermonuclear Thrive Score Error:', error.message);
    throw error;
  }
}

/**
 * Calculate progress percentage for a roadmap
 * @param {Array<{status: string}>} tasks - Array of tasks
 * @returns {number} Progress percentage (0-100)
 */
function calculateProgress(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 0;
  }

  const completedCount = tasks.filter(task => 
    task.status === 'completed' || task.status === 'success'
  ).length;

  const progress = (completedCount / tasks.length) * 100;
  return Math.round(progress);
}

/**
 * Generate progress report
 * @param {object} thriveResult - Result from calcThrive
 * @param {Array} additionalMetrics - Additional metrics to include
 * @returns {object} Comprehensive progress report
 */
function generateProgressReport(thriveResult, additionalMetrics = []) {
  const report = {
    summary: {
      thrive_score: thriveResult.score,
      status: thriveResult.status,
      health: thriveResult.score > 0.8 ? 'excellent' : 
              thriveResult.score > 0.6 ? 'good' : 
              thriveResult.score > 0.4 ? 'fair' : 'needs_attention',
      timestamp: new Date().toISOString()
    },
    breakdown: thriveResult.components,
    insights: [],
    recommendations: []
  };

  // Generate insights based on components
  if (thriveResult.components.completion < 0.5) {
    report.insights.push('Low completion rate detected - many tasks are failing');
    report.recommendations.push('Review agent configurations and error logs');
  }

  if (thriveResult.components.ui_polish < 0.2) {
    report.insights.push('Limited UI tasks in workflow');
    report.recommendations.push('Consider adding more UI/UX focused tasks for better user experience');
  }

  if (thriveResult.components.risk < 0.9) {
    report.insights.push('High failure rate impacting risk score');
    report.recommendations.push('Implement retry logic and error recovery mechanisms');
  }

  // Add any additional metrics
  if (additionalMetrics.length > 0) {
    report.additional_metrics = additionalMetrics;
  }

  return report;
}

// Export functions
module.exports = {
  calcThrive,
  calculateProgress,
  generateProgressReport
};

// Run if called directly
if (require.main === module) {
  console.log('Thermonuclear Progress: Running test calculation');
  
  // Test with dummy data matching spec
  const testLogs = [
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'code' },
    { status: 'fail', type: 'deploy' }
  ];

  try {
    const result = calcThrive(testLogs);
    console.log('\nTest Result:', JSON.stringify(result, null, 2));
    
    // Generate full report
    const report = generateProgressReport(result, [
      { name: 'deployment_speed', value: '3.2s', unit: 'seconds' },
      { name: 'code_quality', value: 0.92, unit: 'score' }
    ]);
    
    console.log('\nProgress Report:', JSON.stringify(report, null, 2));
    console.log('\nThermonuclear Checkpoint: Progress calculation test completed successfully');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }

  // Additional test cases
  console.log('\n--- Additional Test Cases ---');
  
  // Test case 1: All successful
  const allSuccess = [
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'code' }
  ];
  console.log('\nAll Success:', calcThrive(allSuccess));
  
  // Test case 2: All failed
  const allFailed = [
    { status: 'fail', type: 'ui' },
    { status: 'fail', type: 'code' },
    { status: 'fail', type: 'deploy' }
  ];
  console.log('\nAll Failed:', calcThrive(allFailed));
  
  // Test case 3: Mixed with high UI
  const highUI = [
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'ui' },
    { status: 'success', type: 'ui' },
    { status: 'fail', type: 'code' }
  ];
  console.log('\nHigh UI Focus:', calcThrive(highUI));
}