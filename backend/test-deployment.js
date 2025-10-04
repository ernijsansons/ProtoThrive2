#!/usr/bin/env node

/**
 * ProtoThrive Backend Deployment Test Script
 * Comprehensive testing of API endpoints and functionality
 */

import { performance } from 'perf_hooks';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8787';
const TIMEOUT = 10000;

class DeploymentTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    const start = performance.now();

    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      const duration = (performance.now() - start).toFixed(2);
      console.log(`✅ PASS: ${name} (${duration}ms)`);
      this.results.passed++;
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2);
      console.error(`❌ FAIL: ${name} (${duration}ms)`);
      console.error(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
    }
  }

  async makeRequest(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${TIMEOUT}ms`);
      }
      throw error;
    }
  }

  async testHealthEndpoint() {
    const response = await this.makeRequest('/health');

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const requiredFields = ['status', 'timestamp', 'version', 'message'];
    for (const field of requiredFields) {
      if (!response.data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (response.data.status !== 'healthy') {
      throw new Error(`Expected status 'healthy', got '${response.data.status}'`);
    }
  }

  async testStatusEndpoint() {
    const response = await this.makeRequest('/api/status');

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.endpoints) {
      throw new Error('Missing endpoints configuration');
    }
  }

  async testCorsHeaders() {
    const response = await this.makeRequest('/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });

    if (response.status !== 204) {
      throw new Error(`Expected CORS preflight status 204, got ${response.status}`);
    }

    const requiredHeaders = [
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-max-age'
    ];

    for (const header of requiredHeaders) {
      if (!response.headers[header]) {
        throw new Error(`Missing CORS header: ${header}`);
      }
    }
  }

  async testSecurityHeaders() {
    const response = await this.makeRequest('/health');

    const requiredSecurityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];

    for (const header of requiredSecurityHeaders) {
      if (!response.headers[header]) {
        throw new Error(`Missing security header: ${header}`);
      }
    }
  }

  async testRateLimiting() {
    // Make multiple rapid requests to test rate limiting
    const promises = Array.from({ length: 105 }, () =>
      this.makeRequest('/health')
    );

    const responses = await Promise.allSettled(promises);

    // Check if any requests were rate limited
    const rateLimitedRequests = responses.filter(result =>
      result.status === 'fulfilled' && result.value.status === 429
    );

    if (rateLimitedRequests.length === 0) {
      console.warn('⚠️  Warning: Rate limiting may not be working (no 429 responses)');
    }
  }

  async testUserRegistration() {
    const testUser = {
      email: `test-${Date.now()}@protothrive.com`,
      password: 'TestPassword123!@#',
      name: 'Test User'
    };

    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    if (response.status !== 201) {
      throw new Error(`Registration failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.data.accessToken) {
      throw new Error('Registration response missing access token');
    }

    // Store for login test
    this.testUser = testUser;
    this.accessToken = response.data.data.accessToken;
  }

  async testUserLogin() {
    if (!this.testUser) {
      throw new Error('Test user not created - run registration test first');
    }

    const response = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: this.testUser.email,
        password: this.testUser.password
      })
    });

    if (response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.data.accessToken) {
      throw new Error('Login response missing access token');
    }

    this.accessToken = response.data.data.accessToken;
  }

  async testProtectedEndpoint() {
    if (!this.accessToken) {
      throw new Error('No access token available - run login test first');
    }

    const response = await this.makeRequest('/api/roadmaps', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`Protected endpoint failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!Array.isArray(response.data.data)) {
      throw new Error('Roadmaps response should contain data array');
    }
  }

  async testInvalidEndpoint() {
    const response = await this.makeRequest('/invalid/endpoint');

    if (response.status !== 404) {
      throw new Error(`Expected 404 for invalid endpoint, got ${response.status}`);
    }

    if (!response.data.available_endpoints) {
      throw new Error('404 response should include available endpoints');
    }
  }

  async testDatabaseConnectivity() {
    // Test through snippets endpoint which should work without auth
    const response = await this.makeRequest('/api/snippets');

    if (response.status !== 200) {
      throw new Error(`Database connectivity test failed: ${response.status}`);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 DEPLOYMENT TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}`);
        console.log(`   ${error.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Deployment is ready for production.');
      process.exit(0);
    } else {
      console.log('💥 SOME TESTS FAILED! Please fix issues before deploying.');
      process.exit(1);
    }
  }

  async runAllTests() {
    console.log(`🚀 Starting deployment tests against ${BASE_URL}`);
    console.log('=' .repeat(60));

    // Basic connectivity and health
    await this.runTest('Health Endpoint', () => this.testHealthEndpoint());
    await this.runTest('Status Endpoint', () => this.testStatusEndpoint());
    await this.runTest('CORS Headers', () => this.testCorsHeaders());
    await this.runTest('Security Headers', () => this.testSecurityHeaders());
    await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity());

    // Security and rate limiting
    await this.runTest('Rate Limiting', () => this.testRateLimiting());

    // Authentication flow
    await this.runTest('User Registration', () => this.testUserRegistration());
    await this.runTest('User Login', () => this.testUserLogin());
    await this.runTest('Protected Endpoint Access', () => this.testProtectedEndpoint());

    // Error handling
    await this.runTest('Invalid Endpoint (404)', () => this.testInvalidEndpoint());

    this.printResults();
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DeploymentTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

export default DeploymentTester;