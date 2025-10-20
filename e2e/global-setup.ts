/**
 * Global Setup for Playwright Tests
 * Creates necessary directories before test execution
 */

import * as fs from 'fs';
import * as path from 'path';

async function globalSetup() {
  // Create test-results directory structure
  const dirs = [
    'test-results',
    'test-results/screenshots',
    'test-results/html-report',
  ];

  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  console.log('✓ Test directories created');
  console.log('✓ Starting ProtoThrive E2E Test Suite');
  console.log('');
}

export default globalSetup;
