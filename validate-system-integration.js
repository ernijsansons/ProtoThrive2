// Ref: CLAUDE.md System Integration Validation v2.0.0
// Thermonuclear integration testing across all components

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Thermonuclear logging
const log = (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const emoji = level === 'SUCCESS' ? '✅' : level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🔥';
    console.log(`${emoji} [${timestamp}] THERMONUCLEAR ${level}: ${message}`);
};

// Configuration
const CONFIG = {
    projectRoot: process.cwd(),
    components: {
        backend: 'backend',
        frontend: 'frontend',
        deploy: 'protothrive-deploy',
        aiCore: 'ai-core',
        security: 'security',
        automation: 'automation',
        utils: 'utils'
    },
    requiredFiles: {
        'backend/src/index.ts': 'Backend main entry point',
        'backend/utils/db.ts': 'Database utilities',
        'backend/utils/validation.ts': 'Validation utilities',
        'backend/migrations/001_unified_production_schema.sql': 'Production database schema',
        'frontend/src/components/MagicCanvas.tsx': 'Main canvas component',
        'frontend/src/store.ts': 'Frontend state management',
        'protothrive-deploy/package.json': 'Deployment configuration',
        'utils/mocks.ts': 'Unified mocks infrastructure',
        'CLAUDE.md': 'Master control document'
    },
    packageJsonFiles: [
        'backend/package.json',
        'frontend/package.json',
        'protothrive-deploy/package.json',
        'automation/package.json',
        'security/package.json'
    ]
};

// Validation results
const results = {
    passed: [],
    failed: [],
    warnings: [],
    score: 0
};

// File existence validation
function validateFileStructure() {
    log('Validating file structure...');
    
    for (const [filePath, description] of Object.entries(CONFIG.requiredFiles)) {
        const fullPath = path.join(CONFIG.projectRoot, filePath);
        
        if (fs.existsSync(fullPath)) {
            results.passed.push(`File exists: ${filePath} (${description})`);
        } else {
            results.failed.push(`Missing file: ${filePath} (${description})`);
        }
    }
    
    log(`File structure validation complete: ${results.passed.length} passed, ${results.failed.length} failed`);
}

// Package.json validation
function validatePackageFiles() {
    log('Validating package.json files...');
    
    CONFIG.packageJsonFiles.forEach(packagePath => {
        const fullPath = path.join(CONFIG.projectRoot, packagePath);
        
        if (fs.existsSync(fullPath)) {
            try {
                const packageData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                
                // Check required fields
                if (!packageData.name) {
                    results.failed.push(`${packagePath}: Missing 'name' field`);
                } else if (!packageData.version) {
                    results.failed.push(`${packagePath}: Missing 'version' field`);
                } else if (!packageData.scripts) {
                    results.failed.push(`${packagePath}: Missing 'scripts' field`);
                } else {
                    results.passed.push(`${packagePath}: Valid package.json`);
                    
                    // Check for thermonuclear compliance
                    if (packageData.description && packageData.description.includes('Thermonuclear')) {
                        results.passed.push(`${packagePath}: Thermonuclear compliance detected`);
                    }
                }
                
            } catch (error) {
                results.failed.push(`${packagePath}: Invalid JSON - ${error.message}`);
            }
        } else {
            results.failed.push(`${packagePath}: Package file not found`);
        }
    });
}

// CLAUDE.md compliance validation
function validateClaudeMdCompliance() {
    log('Validating CLAUDE.md compliance...');
    
    const claudePath = path.join(CONFIG.projectRoot, 'CLAUDE.md');
    
    if (fs.existsSync(claudePath)) {
        const claudeContent = fs.readFileSync(claudePath, 'utf8');
        
        // Check for required sections
        const requiredSections = [
            'Thermonuclear',
            'Global Configs & Mocks',
            'Dummy Data',
            'Thrive Score',
            'Validation Protocol'
        ];
        
        requiredSections.forEach(section => {
            if (claudeContent.includes(section)) {
                results.passed.push(`CLAUDE.md contains required section: ${section}`);
            } else {
                results.failed.push(`CLAUDE.md missing section: ${section}`);
            }
        });
        
        // Check version
        const versionMatch = claudeContent.match(/Version.*?2\.0\.0/);
        if (versionMatch) {
            results.passed.push('CLAUDE.md version 2.0.0 detected');
        } else {
            results.warnings.push('CLAUDE.md version not clearly marked as 2.0.0');
        }
        
    } else {
        results.failed.push('CLAUDE.md master control document not found');
    }
}

// Mock infrastructure validation
function validateMockInfrastructure() {
    log('Validating mock infrastructure...');
    
    const mocksPath = path.join(CONFIG.projectRoot, 'utils/mocks.ts');
    
    if (fs.existsSync(mocksPath)) {
        const mocksContent = fs.readFileSync(mocksPath, 'utf8');
        
        const requiredMocks = [
            'mockFetch',
            'mockDbQuery',
            'calculateThriveScore',
            'thermonuclearLog',
            'mockValidation',
            'checkKillSwitch'
        ];
        
        requiredMocks.forEach(mock => {
            if (mocksContent.includes(mock)) {
                results.passed.push(`Mock infrastructure contains: ${mock}`);
            } else {
                results.failed.push(`Mock infrastructure missing: ${mock}`);
            }
        });
        
        // Check for thermonuclear logging
        if (mocksContent.includes('THERMONUCLEAR')) {
            results.passed.push('Thermonuclear logging patterns detected in mocks');
        } else {
            results.warnings.push('Limited thermonuclear logging in mocks');
        }
        
    } else {
        results.failed.push('Mock infrastructure file not found');
    }
}

// Database schema validation
function validateDatabaseSchema() {
    log('Validating database schema...');
    
    const schemaPath = path.join(CONFIG.projectRoot, 'backend/migrations/001_unified_production_schema.sql');
    
    if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        const requiredTables = [
            'users',
            'roadmaps',
            'snippets',
            'agent_logs',
            'insights'
        ];
        
        requiredTables.forEach(table => {
            const tableRegex = new RegExp(`CREATE TABLE.*${table}`, 'i');
            if (tableRegex.test(schemaContent)) {
                results.passed.push(`Database schema contains table: ${table}`);
            } else {
                results.failed.push(`Database schema missing table: ${table}`);
            }
        });
        
        // Check for thermonuclear comments
        if (schemaContent.includes('Thermonuclear') || schemaContent.includes('CLAUDE.md')) {
            results.passed.push('Database schema has thermonuclear compliance comments');
        } else {
            results.warnings.push('Database schema lacks thermonuclear compliance markers');
        }
        
    } else {
        results.failed.push('Unified production database schema not found');
    }
}

// Component integration validation
function validateComponentIntegration() {
    log('Validating component integration...');
    
    // Check backend-frontend integration points
    const backendIndex = path.join(CONFIG.projectRoot, 'backend/src/index.ts');
    const frontendCanvas = path.join(CONFIG.projectRoot, 'frontend/src/components/MagicCanvas.tsx');
    
    if (fs.existsSync(backendIndex) && fs.existsSync(frontendCanvas)) {
        const backendContent = fs.readFileSync(backendIndex, 'utf8');
        const frontendContent = fs.readFileSync(frontendCanvas, 'utf8');
        
        // Check for API endpoints
        const apiEndpoints = ['/api/roadmaps', '/api/snippets', '/health'];
        apiEndpoints.forEach(endpoint => {
            if (backendContent.includes(endpoint)) {
                results.passed.push(`Backend contains API endpoint: ${endpoint}`);
            } else {
                results.failed.push(`Backend missing API endpoint: ${endpoint}`);
            }
        });
        
        // Check for 2D/3D integration
        if (frontendContent.includes('ReactFlow') && frontendContent.includes('Spline')) {
            results.passed.push('Frontend has 2D/3D canvas integration');
        } else {
            results.failed.push('Frontend missing 2D/3D integration');
        }
        
        // Check for store integration
        if (frontendContent.includes('useStore')) {
            results.passed.push('Frontend uses state management');
        } else {
            results.failed.push('Frontend missing state management integration');
        }
    }
}

// Test infrastructure validation
function validateTestInfrastructure() {
    log('Validating test infrastructure...');
    
    const testFiles = [
        'backend/tests/test_comprehensive.ts',
        'frontend/src/__tests__/integration.test.tsx'
    ];
    
    testFiles.forEach(testFile => {
        const testPath = path.join(CONFIG.projectRoot, testFile);
        
        if (fs.existsSync(testPath)) {
            const testContent = fs.readFileSync(testPath, 'utf8');
            
            // Check for comprehensive test coverage
            const testPatterns = ['describe', 'test', 'expect', 'beforeAll', 'afterAll'];
            const foundPatterns = testPatterns.filter(pattern => testContent.includes(pattern));
            
            if (foundPatterns.length >= 4) {
                results.passed.push(`${testFile}: Comprehensive test structure detected`);
            } else {
                results.warnings.push(`${testFile}: Limited test structure (${foundPatterns.length}/5 patterns)`);
            }
            
            // Check for thermonuclear compliance
            if (testContent.includes('Thermonuclear') || testContent.includes('CLAUDE.md')) {
                results.passed.push(`${testFile}: Thermonuclear compliance in tests`);
            }
            
        } else {
            results.failed.push(`Test file not found: ${testFile}`);
        }
    });
}

// Git status validation
function validateGitStatus() {
    log('Validating git status...');
    
    try {
        const gitStatus = execSync('git status --porcelain', { cwd: CONFIG.projectRoot, encoding: 'utf8' });
        const modifiedFiles = gitStatus.trim().split('\n').filter(line => line.trim());
        
        if (modifiedFiles.length === 0) {
            results.passed.push('Git working directory is clean');
        } else {
            results.warnings.push(`Git has ${modifiedFiles.length} modified/untracked files`);
            
            // Check for critical files
            const criticalFiles = modifiedFiles.filter(line => 
                line.includes('.md') || 
                line.includes('package.json') || 
                line.includes('.sql') ||
                line.includes('.ts') ||
                line.includes('.tsx')
            );
            
            if (criticalFiles.length > 0) {
                results.warnings.push(`Critical files modified: ${criticalFiles.length}`);
            }
        }
        
        // Check current branch
        const currentBranch = execSync('git branch --show-current', { cwd: CONFIG.projectRoot, encoding: 'utf8' }).trim();
        if (currentBranch === 'proto-cleanup') {
            results.passed.push(`On expected branch: ${currentBranch}`);
        } else {
            results.warnings.push(`On branch '${currentBranch}', expected 'proto-cleanup'`);
        }
        
    } catch (error) {
        results.failed.push(`Git validation failed: ${error.message}`);
    }
}

// Calculate final score
function calculateScore() {
    const totalPassed = results.passed.length;
    const totalFailed = results.failed.length;
    const totalWarnings = results.warnings.length;
    const totalChecks = totalPassed + totalFailed + totalWarnings;
    
    if (totalChecks === 0) {
        results.score = 0;
        return;
    }
    
    // Score calculation: passed worth 1, warnings worth 0.5, failed worth 0
    const weightedScore = (totalPassed * 1.0) + (totalWarnings * 0.5) + (totalFailed * 0.0);
    results.score = Math.round((weightedScore / totalChecks) * 100) / 100;
}

// Generate report
function generateReport() {
    calculateScore();
    
    const timestamp = new Date().toISOString();
    const report = {
        timestamp,
        project: 'ProtoThrive',
        version: '2.0.0',
        environment: 'integration-test',
        score: results.score,
        status: results.score >= 0.95 ? 'EXCELLENT' : results.score >= 0.8 ? 'GOOD' : results.score >= 0.6 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT',
        summary: {
            passed: results.passed.length,
            failed: results.failed.length,
            warnings: results.warnings.length,
            total: results.passed.length + results.failed.length + results.warnings.length
        },
        details: results
    };
    
    // Write report to file
    const reportPath = path.join(CONFIG.projectRoot, `integration-validation-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return { report, reportPath };
}

// Main validation function
async function main() {
    log('🔥 THERMONUCLEAR SYSTEM INTEGRATION VALIDATION INITIATED', 'INFO');
    log(`Project Root: ${CONFIG.projectRoot}`);
    
    // Run all validations
    validateFileStructure();
    validatePackageFiles();
    validateClaudeMdCompliance();
    validateMockInfrastructure();
    validateDatabaseSchema();
    validateComponentIntegration();
    validateTestInfrastructure();
    validateGitStatus();
    
    // Generate report
    const { report, reportPath } = generateReport();
    
    // Output results
    log('');
    log('='.repeat(80));
    log('📊 THERMONUCLEAR INTEGRATION VALIDATION RESULTS');
    log('='.repeat(80));
    log(`Overall Score: ${report.score} (${report.status})`);
    log(`Passed: ${report.summary.passed}`);
    log(`Failed: ${report.summary.failed}`);
    log(`Warnings: ${report.summary.warnings}`);
    log(`Total Checks: ${report.summary.total}`);
    log('');
    
    if (results.failed.length > 0) {
        log('❌ FAILED CHECKS:', 'ERROR');
        results.failed.forEach(fail => log(`   - ${fail}`, 'ERROR'));
        log('');
    }
    
    if (results.warnings.length > 0) {
        log('⚠️  WARNING CHECKS:', 'WARN');
        results.warnings.forEach(warn => log(`   - ${warn}`, 'WARN'));
        log('');
    }
    
    if (results.passed.length > 0) {
        log('✅ PASSED CHECKS:', 'SUCCESS');
        results.passed.forEach(pass => log(`   - ${pass}`, 'SUCCESS'));
        log('');
    }
    
    log(`📄 Detailed report saved: ${reportPath}`);
    log('');
    
    if (report.score >= 0.95) {
        log('🎉 THERMONUCLEAR INTEGRATION VALIDATION: EXCELLENT - READY FOR DEPLOYMENT!', 'SUCCESS');
    } else if (report.score >= 0.8) {
        log('🟡 THERMONUCLEAR INTEGRATION VALIDATION: GOOD - MINOR ISSUES TO RESOLVE', 'WARN');
    } else if (report.score >= 0.6) {
        log('🟠 THERMONUCLEAR INTEGRATION VALIDATION: ACCEPTABLE - IMPROVEMENTS RECOMMENDED', 'WARN');
    } else {
        log('🔴 THERMONUCLEAR INTEGRATION VALIDATION: NEEDS IMPROVEMENT - ADDRESS CRITICAL ISSUES', 'ERROR');
        process.exit(1);
    }
    
    log('🔥 Thermonuclear validation complete - All systems checked');
}

// Execute if run directly
if (require.main === module) {
    main().catch(error => {
        log(`Validation failed: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

module.exports = { main, validateFileStructure, calculateScore };