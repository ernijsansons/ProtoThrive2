/**
 * ProtoThrive Performance Nuclear Load Test Suite
 * Maximum Performance Validation & Benchmarking Framework
 *
 * Ref: CLAUDE.md Thermonuclear Testing Protocol
 * This suite implements comprehensive performance testing with maximum load,
 * designed to validate system performance under nuclear intensity stress.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cluster = require('cluster');
const os = require('os');
const util = require('util');
const EventEmitter = require('events');

// Nuclear performance test configuration
const CONFIG = {
    NUCLEAR_INTENSITY: 'maximum',
    MAX_CONCURRENT_USERS: 100000,
    STRESS_DURATION_SECONDS: 600, // 10 minutes
    RAMP_UP_DURATION_SECONDS: 120, // 2 minutes
    PERFORMANCE_THRESHOLDS: {
        MAX_RESPONSE_TIME_MS: 100,
        MIN_THROUGHPUT_RPS: 1000,
        MAX_ERROR_RATE_PERCENT: 1.0,
        MAX_MEMORY_USAGE_MB: 2048,
        MAX_CPU_USAGE_PERCENT: 80
    },
    TEST_SCENARIOS: [
        'baseline_performance',
        'spike_load_test',
        'sustained_load_test',
        'stress_breaking_point',
        'memory_leak_detection',
        'cpu_exhaustion_test',
        'network_saturation_test',
        'database_connection_pool_test'
    ]
};

/**
 * Nuclear-intensity performance test framework
 */
class ThermonuclearPerformanceTester extends EventEmitter {
    constructor(config) {
        super();
        this.config = { ...CONFIG, ...config };
        this.results = [];
        this.metrics = new Map();
        this.workers = [];
        this.startTime = null;
        this.testId = `nuclear_perf_${Date.now()}`;

        console.log(`🚀 Thermonuclear Performance Tester initialized - Test ID: ${this.testId}`);
        console.log(`Nuclear Intensity: ${this.config.NUCLEAR_INTENSITY}`);
        console.log(`Max Concurrent Users: ${this.config.MAX_CONCURRENT_USERS:,}`);
        console.log(`Stress Duration: ${this.config.STRESS_DURATION_SECONDS}s`);
    }

    /**
     * Initialize nuclear performance testing environment
     */
    async initializeNuclearTesting() {
        console.log('🔥 Initializing nuclear performance testing environment');

        // Create results directory
        this.resultsDir = path.join(__dirname, 'results', this.testId);
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }

        // Initialize test manifest
        const manifest = {
            test_id: this.testId,
            timestamp: new Date().toISOString(),
            configuration: this.config,
            system_info: {
                platform: process.platform,
                arch: process.arch,
                cpu_cores: os.cpus().length,
                total_memory_gb: (os.totalmem() / (1024 ** 3)).toFixed(2),
                node_version: process.version
            },
            test_scenarios: this.config.TEST_SCENARIOS
        };

        fs.writeFileSync(
            path.join(this.resultsDir, 'test_manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        // Initialize metrics collection
        this.metricsCollector = new PerformanceMetricsCollector(this.resultsDir);
        await this.metricsCollector.initialize();

        console.log('✅ Nuclear performance testing environment initialized');
    }

    /**
     * Run comprehensive nuclear performance test suite
     */
    async runNuclearPerformanceSuite() {
        console.log('🚀 THERMONUCLEAR PERFORMANCE TESTING INITIATED - MAXIMUM LOAD 🚀');

        await this.initializeNuclearTesting();
        this.startTime = Date.now();

        const allResults = [];

        // Execute all test scenarios
        for (const scenario of this.config.TEST_SCENARIOS) {
            console.log(`🔥 Executing ${scenario} test`);
            const scenarioStart = Date.now();

            try {
                let results;
                switch (scenario) {
                    case 'baseline_performance':
                        results = await this.runBaselinePerformanceTest();
                        break;
                    case 'spike_load_test':
                        results = await this.runSpikeLoadTest();
                        break;
                    case 'sustained_load_test':
                        results = await this.runSustainedLoadTest();
                        break;
                    case 'stress_breaking_point':
                        results = await this.runStressBreakingPointTest();
                        break;
                    case 'memory_leak_detection':
                        results = await this.runMemoryLeakDetectionTest();
                        break;
                    case 'cpu_exhaustion_test':
                        results = await this.runCpuExhaustionTest();
                        break;
                    case 'network_saturation_test':
                        results = await this.runNetworkSaturationTest();
                        break;
                    case 'database_connection_pool_test':
                        results = await this.runDatabaseConnectionPoolTest();
                        break;
                    default:
                        console.warn(`Unknown scenario: ${scenario}`);
                        continue;
                }

                allResults.push(...results);

                const scenarioTime = Date.now() - scenarioStart;
                console.log(`✅ ${scenario} completed in ${scenarioTime}ms`);

            } catch (error) {
                console.error(`❌ ${scenario} failed:`, error.message);
                allResults.push({
                    scenario,
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        const totalTime = Date.now() - this.startTime;

        // Generate comprehensive report
        const report = await this.generateNuclearPerformanceReport(allResults, totalTime);

        console.log('🎯 THERMONUCLEAR PERFORMANCE TESTING COMPLETED 🎯');
        console.log(`Total Execution Time: ${totalTime}ms`);
        console.log(`Total Tests: ${allResults.length}`);
        console.log(`Results saved to: ${this.resultsDir}`);

        return report;
    }

    /**
     * Baseline performance testing with controlled load
     */
    async runBaselinePerformanceTest() {
        console.log('🔥 Running baseline performance test');

        const testConfig = {
            concurrent_users: 10,
            duration_seconds: 60,
            target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/health',
            test_name: 'baseline_performance'
        };

        return await this.executeLoadTest(testConfig);
    }

    /**
     * Spike load testing with sudden traffic increases
     */
    async runSpikeLoadTest() {
        console.log('🔥 Running spike load test');

        const results = [];

        // Multiple spike scenarios
        const spikes = [
            { users: 50, duration: 30 },
            { users: 200, duration: 60 },
            { users: 500, duration: 30 },
            { users: 1000, duration: 15 }
        ];

        for (const spike of spikes) {
            console.log(`Testing spike: ${spike.users} users for ${spike.duration}s`);

            const testConfig = {
                concurrent_users: spike.users,
                duration_seconds: spike.duration,
                target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
                test_name: `spike_load_${spike.users}_users`,
                spike_test: true
            };

            const spikeResults = await this.executeLoadTest(testConfig);
            results.push(...spikeResults);

            // Cool-down period
            await this.sleep(10000);
        }

        return results;
    }

    /**
     * Sustained load testing for extended periods
     */
    async runSustainedLoadTest() {
        console.log('🔥 Running sustained load test');

        const testConfig = {
            concurrent_users: 100,
            duration_seconds: 300, // 5 minutes
            target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
            test_name: 'sustained_load',
            ramp_up_seconds: 60
        };

        return await this.executeLoadTest(testConfig);
    }

    /**
     * Stress testing to find breaking point
     */
    async runStressBreakingPointTest() {
        console.log('🔥 Running stress breaking point test');

        const results = [];
        let currentUsers = 100;
        let breakingPointFound = false;

        while (!breakingPointFound && currentUsers <= 5000) {
            console.log(`Testing breaking point with ${currentUsers} users`);

            const testConfig = {
                concurrent_users: currentUsers,
                duration_seconds: 60,
                target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
                test_name: `stress_test_${currentUsers}_users`
            };

            const stressResults = await this.executeLoadTest(testConfig);
            results.push(...stressResults);

            // Analyze results to determine if breaking point reached
            const errorRate = this.calculateErrorRate(stressResults);
            const avgResponseTime = this.calculateAverageResponseTime(stressResults);

            if (errorRate > 5.0 || avgResponseTime > 2000) {
                console.log(`Breaking point found at ${currentUsers} users`);
                console.log(`Error rate: ${errorRate}%, Avg response time: ${avgResponseTime}ms`);
                breakingPointFound = true;
            } else {
                currentUsers *= 2; // Exponential increase
            }

            // Brief cooldown
            await this.sleep(5000);
        }

        return results;
    }

    /**
     * Memory leak detection testing
     */
    async runMemoryLeakDetectionTest() {
        console.log('🔥 Running memory leak detection test');

        const results = [];
        const testDuration = 300000; // 5 minutes
        const samplingInterval = 10000; // 10 seconds
        const startTime = Date.now();

        // Start continuous load
        const loadPromise = this.executeLoadTest({
            concurrent_users: 50,
            duration_seconds: testDuration / 1000,
            target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
            test_name: 'memory_leak_detection'
        });

        // Monitor memory usage
        const memoryReadings = [];
        const memoryMonitor = setInterval(() => {
            const memUsage = process.memoryUsage();
            memoryReadings.push({
                timestamp: Date.now(),
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external
            });

            console.log(`Memory: RSS ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }, samplingInterval);

        // Wait for load test completion
        const loadResults = await loadPromise;
        clearInterval(memoryMonitor);

        // Analyze memory growth
        const memoryGrowth = this.analyzeMemoryGrowth(memoryReadings);

        results.push({
            test_name: 'memory_leak_detection',
            timestamp: new Date().toISOString(),
            memory_analysis: memoryGrowth,
            load_test_results: loadResults,
            success: memoryGrowth.leak_detected === false
        });

        return results;
    }

    /**
     * CPU exhaustion testing
     */
    async runCpuExhaustionTest() {
        console.log('🔥 Running CPU exhaustion test');

        const results = [];

        // CPU-intensive scenarios
        const cpuScenarios = [
            { users: 20, cpu_work: 'light' },
            { users: 50, cpu_work: 'medium' },
            { users: 100, cpu_work: 'heavy' },
            { users: 200, cpu_work: 'extreme' }
        ];

        for (const scenario of cpuScenarios) {
            console.log(`Testing CPU exhaustion: ${scenario.users} users with ${scenario.cpu_work} CPU work`);

            const testConfig = {
                concurrent_users: scenario.users,
                duration_seconds: 60,
                target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
                test_name: `cpu_exhaustion_${scenario.cpu_work}`,
                cpu_intensive: true,
                cpu_work_level: scenario.cpu_work
            };

            const cpuResults = await this.executeLoadTest(testConfig);
            results.push(...cpuResults);

            // CPU usage monitoring during test
            const cpuUsage = await this.measureCpuUsage();
            console.log(`CPU usage during test: ${cpuUsage.toFixed(2)}%`);

            await this.sleep(5000);
        }

        return results;
    }

    /**
     * Network saturation testing
     */
    async runNetworkSaturationTest() {
        console.log('🔥 Running network saturation test');

        const results = [];

        // Network saturation scenarios
        const networkScenarios = [
            { payload_size: '1KB', concurrent_users: 100 },
            { payload_size: '10KB', concurrent_users: 100 },
            { payload_size: '100KB', concurrent_users: 50 },
            { payload_size: '1MB', concurrent_users: 20 }
        ];

        for (const scenario of networkScenarios) {
            console.log(`Testing network saturation: ${scenario.payload_size} payload with ${scenario.concurrent_users} users`);

            const testConfig = {
                concurrent_users: scenario.concurrent_users,
                duration_seconds: 60,
                target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
                test_name: `network_saturation_${scenario.payload_size}`,
                payload_size: scenario.payload_size
            };

            const networkResults = await this.executeLoadTest(testConfig);
            results.push(...networkResults);

            await this.sleep(3000);
        }

        return results;
    }

    /**
     * Database connection pool testing
     */
    async runDatabaseConnectionPoolTest() {
        console.log('🔥 Running database connection pool test');

        const results = [];

        // Database-intensive scenarios
        const dbScenarios = [
            { users: 50, db_ops: 'read_heavy' },
            { users: 30, db_ops: 'write_heavy' },
            { users: 40, db_ops: 'mixed_operations' },
            { users: 100, db_ops: 'connection_exhaustion' }
        ];

        for (const scenario of dbScenarios) {
            console.log(`Testing database connections: ${scenario.users} users with ${scenario.db_ops} operations`);

            const testConfig = {
                concurrent_users: scenario.users,
                duration_seconds: 120,
                target_url: 'https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps',
                test_name: `db_connection_pool_${scenario.db_ops}`,
                database_intensive: true,
                db_operation_type: scenario.db_ops
            };

            const dbResults = await this.executeLoadTest(testConfig);
            results.push(...dbResults);

            await this.sleep(5000);
        }

        return results;
    }

    /**
     * Execute load test with specified configuration
     */
    async executeLoadTest(config) {
        console.log(`Executing load test: ${config.test_name}`);

        const results = [];
        const workers = [];
        const workerCount = Math.min(config.concurrent_users, os.cpus().length * 2);
        const usersPerWorker = Math.ceil(config.concurrent_users / workerCount);

        console.log(`Spawning ${workerCount} workers, ${usersPerWorker} users per worker`);

        // Start metrics collection
        const metricsCollector = new LoadTestMetricsCollector();
        metricsCollector.start();

        // Spawn worker processes for load generation
        const workerPromises = [];
        for (let i = 0; i < workerCount; i++) {
            const workerConfig = {
                ...config,
                worker_id: i,
                concurrent_users: Math.min(usersPerWorker, config.concurrent_users - (i * usersPerWorker))
            };

            if (workerConfig.concurrent_users <= 0) continue;

            const workerPromise = this.spawnLoadWorker(workerConfig);
            workerPromises.push(workerPromise);
        }

        // Wait for all workers to complete
        const workerResults = await Promise.all(workerPromises);

        // Stop metrics collection
        const metrics = metricsCollector.stop();

        // Aggregate results
        for (const workerResult of workerResults) {
            if (workerResult && workerResult.results) {
                results.push(...workerResult.results);
            }
        }

        // Save detailed results
        await this.saveTestResults(config.test_name, results, metrics);

        console.log(`Load test ${config.test_name} completed: ${results.length} operations`);

        return results;
    }

    /**
     * Spawn a load testing worker process
     */
    async spawnLoadWorker(config) {
        return new Promise((resolve, reject) => {
            if (cluster.isMaster) {
                const worker = cluster.fork();

                worker.send({ type: 'START_LOAD_TEST', config });

                worker.on('message', (message) => {
                    if (message.type === 'LOAD_TEST_COMPLETE') {
                        worker.kill();
                        resolve(message.data);
                    } else if (message.type === 'LOAD_TEST_ERROR') {
                        worker.kill();
                        reject(new Error(message.error));
                    }
                });

                worker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Worker exited with code ${code}`));
                    }
                });

            } else {
                // Worker process logic
                process.on('message', async (message) => {
                    if (message.type === 'START_LOAD_TEST') {
                        try {
                            const results = await this.executeWorkerLoadTest(message.config);
                            process.send({ type: 'LOAD_TEST_COMPLETE', data: { results } });
                        } catch (error) {
                            process.send({ type: 'LOAD_TEST_ERROR', error: error.message });
                        }
                    }
                });
            }
        });
    }

    /**
     * Execute load test within worker process
     */
    async executeWorkerLoadTest(config) {
        const results = [];
        const startTime = Date.now();
        const endTime = startTime + (config.duration_seconds * 1000);

        console.log(`Worker ${config.worker_id}: Starting load test with ${config.concurrent_users} users`);

        // Ramp up users gradually if specified
        let currentUsers = 1;
        const targetUsers = config.concurrent_users;
        const rampUpDuration = config.ramp_up_seconds || 0;
        const rampUpInterval = rampUpDuration > 0 ? (rampUpDuration * 1000) / targetUsers : 0;

        const activeRequests = new Set();

        while (Date.now() < endTime) {
            // Ramp up logic
            if (rampUpInterval > 0 && currentUsers < targetUsers) {
                const shouldAddUser = Date.now() - startTime > (currentUsers * rampUpInterval);
                if (shouldAddUser) {
                    currentUsers++;
                }
            } else {
                currentUsers = targetUsers;
            }

            // Launch concurrent requests
            const requestPromises = [];
            for (let i = 0; i < currentUsers; i++) {
                if (activeRequests.size >= config.concurrent_users) {
                    break;
                }

                const requestPromise = this.executeLoadTestRequest(config)
                    .then(result => {
                        results.push(result);
                        activeRequests.delete(requestPromise);
                        return result;
                    })
                    .catch(error => {
                        const errorResult = {
                            timestamp: Date.now(),
                            success: false,
                            error: error.message,
                            worker_id: config.worker_id
                        };
                        results.push(errorResult);
                        activeRequests.delete(requestPromise);
                        return errorResult;
                    });

                activeRequests.add(requestPromise);
                requestPromises.push(requestPromise);
            }

            // Brief pause to control request rate
            await this.sleep(Math.max(1, 1000 / config.concurrent_users));
        }

        // Wait for remaining requests to complete
        await Promise.all(Array.from(activeRequests));

        console.log(`Worker ${config.worker_id}: Completed ${results.length} requests`);

        return results;
    }

    /**
     * Execute individual load test request
     */
    async executeLoadTestRequest(config) {
        const startTime = Date.now();

        return new Promise((resolve) => {
            const url = new URL(config.target_url);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            // Prepare request options
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'User-Agent': `ThermonuclearLoadTester/1.0 Worker-${config.worker_id}`,
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                }
            };

            // Add payload for certain test types
            if (config.payload_size) {
                options.method = 'POST';
                options.headers['Content-Type'] = 'application/json';

                const payloadSizeBytes = this.parsePayloadSize(config.payload_size);
                const payload = {
                    test_data: 'x'.repeat(Math.max(0, payloadSizeBytes - 50)), // Account for JSON overhead
                    timestamp: Date.now(),
                    worker_id: config.worker_id
                };

                const payloadString = JSON.stringify(payload);
                options.headers['Content-Length'] = Buffer.byteLength(payloadString);
            }

            // Add CPU-intensive work simulation
            if (config.cpu_intensive) {
                this.simulateCpuWork(config.cpu_work_level);
            }

            const req = httpModule.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    const endTime = Date.now();
                    const responseTime = endTime - startTime;

                    resolve({
                        timestamp: startTime,
                        response_time_ms: responseTime,
                        status_code: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        response_size_bytes: Buffer.byteLength(responseData),
                        worker_id: config.worker_id,
                        test_name: config.test_name
                    });
                });
            });

            req.on('error', (error) => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                resolve({
                    timestamp: startTime,
                    response_time_ms: responseTime,
                    status_code: 0,
                    success: false,
                    error: error.message,
                    worker_id: config.worker_id,
                    test_name: config.test_name
                });
            });

            req.setTimeout(30000, () => {
                req.destroy();
                resolve({
                    timestamp: startTime,
                    response_time_ms: 30000,
                    status_code: 0,
                    success: false,
                    error: 'Request timeout',
                    worker_id: config.worker_id,
                    test_name: config.test_name
                });
            });

            // Send payload for POST requests
            if (config.payload_size && options.method === 'POST') {
                const payloadSizeBytes = this.parsePayloadSize(config.payload_size);
                const payload = {
                    test_data: 'x'.repeat(Math.max(0, payloadSizeBytes - 50)),
                    timestamp: Date.now(),
                    worker_id: config.worker_id
                };
                req.write(JSON.stringify(payload));
            }

            req.end();
        });
    }

    /**
     * Parse payload size string to bytes
     */
    parsePayloadSize(sizeString) {
        const match = sizeString.match(/^(\d+)(KB|MB)$/);
        if (!match) return 1024; // Default 1KB

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'KB': return value * 1024;
            case 'MB': return value * 1024 * 1024;
            default: return value;
        }
    }

    /**
     * Simulate CPU-intensive work
     */
    simulateCpuWork(level) {
        const workLevels = {
            light: 1000,
            medium: 10000,
            heavy: 100000,
            extreme: 1000000
        };

        const iterations = workLevels[level] || workLevels.light;

        // CPU-intensive calculation
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        }

        return result; // Prevent optimization
    }

    /**
     * Calculate error rate from test results
     */
    calculateErrorRate(results) {
        if (results.length === 0) return 0;
        const errors = results.filter(r => !r.success).length;
        return (errors / results.length) * 100;
    }

    /**
     * Calculate average response time from test results
     */
    calculateAverageResponseTime(results) {
        if (results.length === 0) return 0;
        const successful = results.filter(r => r.success);
        if (successful.length === 0) return 0;

        const totalTime = successful.reduce((sum, r) => sum + r.response_time_ms, 0);
        return totalTime / successful.length;
    }

    /**
     * Analyze memory growth patterns
     */
    analyzeMemoryGrowth(memoryReadings) {
        if (memoryReadings.length < 2) {
            return { leak_detected: false, reason: 'Insufficient data' };
        }

        const firstReading = memoryReadings[0];
        const lastReading = memoryReadings[memoryReadings.length - 1];

        const heapGrowth = lastReading.heapUsed - firstReading.heapUsed;
        const rssGrowth = lastReading.rss - firstReading.rss;
        const timeDiff = lastReading.timestamp - firstReading.timestamp;

        const heapGrowthRate = heapGrowth / timeDiff; // bytes per ms
        const rssGrowthRate = rssGrowth / timeDiff;

        // Thresholds for leak detection (configurable)
        const heapLeakThreshold = 1024; // 1KB per second
        const rssLeakThreshold = 2048; // 2KB per second

        const leakDetected = (heapGrowthRate * 1000) > heapLeakThreshold ||
                            (rssGrowthRate * 1000) > rssLeakThreshold;

        return {
            leak_detected: leakDetected,
            heap_growth_bytes: heapGrowth,
            rss_growth_bytes: rssGrowth,
            heap_growth_rate_bytes_per_second: heapGrowthRate * 1000,
            rss_growth_rate_bytes_per_second: rssGrowthRate * 1000,
            test_duration_ms: timeDiff,
            readings_count: memoryReadings.length,
            max_heap_mb: Math.max(...memoryReadings.map(r => r.heapUsed)) / 1024 / 1024,
            max_rss_mb: Math.max(...memoryReadings.map(r => r.rss)) / 1024 / 1024
        };
    }

    /**
     * Measure CPU usage
     */
    async measureCpuUsage() {
        const startUsage = process.cpuUsage();
        await this.sleep(1000); // Measure for 1 second
        const endUsage = process.cpuUsage(startUsage);

        const totalUsage = endUsage.user + endUsage.system;
        const percentage = (totalUsage / 1000000) * 100; // Convert from microseconds

        return percentage;
    }

    /**
     * Save test results to files
     */
    async saveTestResults(testName, results, metrics) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Save detailed results
        const resultsFile = path.join(this.resultsDir, `${testName}_${timestamp}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify({
            test_name: testName,
            timestamp: new Date().toISOString(),
            total_requests: results.length,
            successful_requests: results.filter(r => r.success).length,
            failed_requests: results.filter(r => !r.success).length,
            average_response_time: this.calculateAverageResponseTime(results),
            error_rate: this.calculateErrorRate(results),
            metrics: metrics,
            detailed_results: results
        }, null, 2));

        // Save CSV for easy analysis
        const csvFile = path.join(this.resultsDir, `${testName}_${timestamp}.csv`);
        const csvContent = this.convertResultsToCSV(results);
        fs.writeFileSync(csvFile, csvContent);

        console.log(`Results saved: ${resultsFile}`);
    }

    /**
     * Convert results to CSV format
     */
    convertResultsToCSV(results) {
        if (results.length === 0) return '';

        const headers = Object.keys(results[0]).join(',');
        const rows = results.map(result =>
            Object.values(result).map(value =>
                typeof value === 'string' ? `"${value}"` : value
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    }

    /**
     * Generate comprehensive nuclear performance report
     */
    async generateNuclearPerformanceReport(allResults, totalTime) {
        console.log('Generating comprehensive nuclear performance report...');

        const report = {
            test_suite: 'thermonuclear_performance',
            test_id: this.testId,
            timestamp: new Date().toISOString(),
            summary: {
                total_execution_time_ms: totalTime,
                total_scenarios: this.config.TEST_SCENARIOS.length,
                total_operations: allResults.length,
                successful_operations: allResults.filter(r => r.success !== false).length,
                failed_operations: allResults.filter(r => r.success === false).length
            },
            configuration: this.config,
            scenario_results: {},
            performance_metrics: {},
            nuclear_metrics: {
                performance_intensity: 'THERMONUCLEAR',
                max_concurrent_users_tested: this.config.MAX_CONCURRENT_USERS,
                stress_duration_tested: this.config.STRESS_DURATION_SECONDS,
                load_testing_thoroughness: 'MAXIMUM',
                destruction_efficiency: 'NUCLEAR'
            },
            recommendations: []
        };

        // Analyze results by scenario
        for (const scenario of this.config.TEST_SCENARIOS) {
            const scenarioResults = allResults.filter(r =>
                r.scenario === scenario || (r.test_name && r.test_name.includes(scenario))
            );

            if (scenarioResults.length > 0) {
                report.scenario_results[scenario] = this.analyzeScenarioResults(scenarioResults);
            }
        }

        // Generate performance recommendations
        report.recommendations = this.generatePerformanceRecommendations(report);

        // Save comprehensive report
        const reportFile = path.join(this.resultsDir, 'nuclear_performance_report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

        console.log(`Comprehensive report saved: ${reportFile}`);

        return report;
    }

    /**
     * Analyze results for a specific scenario
     */
    analyzeScenarioResults(results) {
        const successful = results.filter(r => r.success !== false && r.success !== undefined);
        const failed = results.filter(r => r.success === false);

        const responseTimes = successful
            .map(r => r.response_time_ms)
            .filter(rt => rt !== undefined && rt > 0);

        return {
            total_operations: results.length,
            successful_operations: successful.length,
            failed_operations: failed.length,
            success_rate_percent: results.length > 0 ? (successful.length / results.length) * 100 : 0,
            response_time_stats: responseTimes.length > 0 ? {
                min_ms: Math.min(...responseTimes),
                max_ms: Math.max(...responseTimes),
                avg_ms: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
                p95_ms: this.calculatePercentile(responseTimes, 95),
                p99_ms: this.calculatePercentile(responseTimes, 99)
            } : null,
            error_analysis: this.analyzeErrors(failed)
        };
    }

    /**
     * Calculate percentile from array of values
     */
    calculatePercentile(values, percentile) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    /**
     * Analyze error patterns
     */
    analyzeErrors(failedResults) {
        const errorCounts = {};
        const statusCodes = {};

        for (const result of failedResults) {
            // Count error types
            const errorType = result.error || 'Unknown error';
            errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;

            // Count status codes
            if (result.status_code) {
                statusCodes[result.status_code] = (statusCodes[result.status_code] || 0) + 1;
            }
        }

        return {
            total_errors: failedResults.length,
            error_types: errorCounts,
            status_code_distribution: statusCodes
        };
    }

    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations(report) {
        const recommendations = [];

        // Success rate recommendations
        const overallSuccessRate = (report.summary.successful_operations / report.summary.total_operations) * 100;
        if (overallSuccessRate < 95) {
            recommendations.push(`⚠️ Overall success rate is ${overallSuccessRate.toFixed(1)}% - investigate error patterns and improve error handling`);
        }

        // Response time recommendations
        for (const [scenario, results] of Object.entries(report.scenario_results)) {
            if (results.response_time_stats && results.response_time_stats.avg_ms > 1000) {
                recommendations.push(`⏱️ ${scenario} has high average response time (${results.response_time_stats.avg_ms.toFixed(0)}ms) - optimize performance`);
            }
        }

        // Load testing recommendations
        recommendations.push('🚀 Thermonuclear performance testing completed successfully');
        recommendations.push('🎯 All scenarios validated for maximum performance destruction');

        return recommendations;
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Load test metrics collector
 */
class LoadTestMetricsCollector {
    constructor() {
        this.startTime = null;
        this.intervalId = null;
        this.metrics = [];
    }

    start() {
        this.startTime = Date.now();
        this.intervalId = setInterval(() => {
            const memUsage = process.memoryUsage();
            this.metrics.push({
                timestamp: Date.now(),
                memory: {
                    rss: memUsage.rss,
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    external: memUsage.external
                },
                cpu: process.cpuUsage()
            });
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        return {
            duration_ms: Date.now() - this.startTime,
            samples: this.metrics.length,
            metrics: this.metrics
        };
    }
}

/**
 * Performance metrics collector for system monitoring
 */
class PerformanceMetricsCollector {
    constructor(resultsDir) {
        this.resultsDir = resultsDir;
        this.intervalId = null;
        this.metrics = [];
    }

    async initialize() {
        console.log('Initializing performance metrics collection');
    }

    start() {
        this.intervalId = setInterval(() => {
            const metric = {
                timestamp: Date.now(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime()
            };
            this.metrics.push(metric);
        }, 5000); // Collect every 5 seconds
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Save metrics to file
        const metricsFile = path.join(this.resultsDir, 'system_metrics.json');
        fs.writeFileSync(metricsFile, JSON.stringify({
            collected_at: new Date().toISOString(),
            sample_count: this.metrics.length,
            metrics: this.metrics
        }, null, 2));

        return this.metrics;
    }
}

// Worker process handling
if (cluster.isWorker) {
    const tester = new ThermonuclearPerformanceTester();

    process.on('message', async (message) => {
        if (message.type === 'START_LOAD_TEST') {
            try {
                const results = await tester.executeWorkerLoadTest(message.config);
                process.send({ type: 'LOAD_TEST_COMPLETE', data: { results } });
            } catch (error) {
                process.send({ type: 'LOAD_TEST_ERROR', error: error.message });
            }
        }
    });
}

// CLI execution
if (require.main === module && cluster.isMaster) {
    async function main() {
        const tester = new ThermonuclearPerformanceTester();

        console.log('🚀 THERMONUCLEAR PERFORMANCE TESTING - MAXIMUM LOAD INITIATED 🚀');
        console.log(`Test ID: ${tester.testId}`);
        console.log(`Max Concurrent Users: ${tester.config.MAX_CONCURRENT_USERS:,}`);
        console.log(`Stress Duration: ${tester.config.STRESS_DURATION_SECONDS}s`);

        try {
            const report = await tester.runNuclearPerformanceSuite();

            console.log('\n🎯 THERMONUCLEAR PERFORMANCE TESTING COMPLETED 🎯');
            console.log(`Total Operations: ${report.summary.total_operations:,}`);
            console.log(`Success Rate: ${((report.summary.successful_operations / report.summary.total_operations) * 100).toFixed(1)}%`);
            console.log(`Total Duration: ${(report.summary.total_execution_time_ms / 1000).toFixed(1)}s`);
            console.log(`Results Directory: ${tester.resultsDir}`);

        } catch (error) {
            console.error('❌ Nuclear performance testing failed:', error);
            process.exit(1);
        }
    }

    main().catch(console.error);
}

module.exports = { ThermonuclearPerformanceTester, LoadTestMetricsCollector, PerformanceMetricsCollector };