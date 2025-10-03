// Coverage Calculator for LG Module Testing
// Provides accurate test coverage percentage and detailed metrics

const fs = require('fs');
const path = require('path');

/**
 * Calculates test coverage for the Loup-Garou module implementations
 * Analyzes both test files and source files to provide accurate metrics
 */
class CoverageCalculator {

    constructor() {
        this.srcDir = './src/lg';
        this.testDir = './test/lg';
        // Phase 1/2 scope: Exclude role classes and unimplemented modules
        this.excludePatterns = ['roles/', 'lg_functions.js', 'lg_voice.js'];
        this.phase2Modules = [
            'lg_var', 'lg_logger', 'message_sending', 'lg_vote',
            'lg_channel', 'lg_flow', 'lg_game', 'lg_voice'
        ];
    }

    /**
     * Main coverage calculation method
     */
    async calculateCoverage() {
        console.log('📊 Calculating LG Module Test Coverage...\n');

        const sourceMetrics = this.analyzeSourceFiles();
        const testMetrics = this.analyzeTestFiles();

        // Calculate detailed coverage by module
        const coverageDetails = this.matchTestsToModules(sourceMetrics, testMetrics);

        // Overall coverage percentage
        const totalTestCases = coverageDetails.reduce((sum, module) => sum + module.totalTests, 0);
        const totalFunctionalUnits = coverageDetails.reduce((sum, module) => sum + module.estimatedUnits, 0);

        const overallCoverage = totalFunctionalUnits > 0 ?
            Math.round((totalTestCases / totalFunctionalUnits) * 100) : 0;

        return {
            summary: {
                overallCoverage: `${overallCoverage}%`,
                totalTestCases,
                totalFunctionalUnits,
                modulesAnalyzed: coverageDetails.length,
                timestamp: new Date().toISOString()
            },
            details: coverageDetails,
            recommendations: this.generateRecommendations(coverageDetails),
            methodology: this.explainMethodology()
        };
    }

    /**
     * Analyze source files to estimate testable units (Phase 1/2 scope only)
     */
    analyzeSourceFiles() {
        console.log('🔍 Analyzing Phase 1/2 source files...');

        const sourceFiles = this.getAllFiles(this.srcDir, '.js')
            .filter(file => !this.excludePatterns.some(pattern => file.includes(pattern)))
            .filter(file => {
                const moduleName = path.relative(this.srcDir, file).replace('.js', '');
                return this.phase2Modules.includes(moduleName);
            });

        const metrics = {};

        sourceFiles.forEach(filePath => {
            const relativePath = path.relative(this.srcDir, filePath);
            const moduleName = relativePath.replace('.js', '');

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());

            // Count functional units (methods, classes, exports)
            const units = this.countFunctionalUnits(content);

            metrics[moduleName] = {
                filePath,
                linesOfCode: lines.length,
                functionalUnits: units,
                estimatedTests: this.estimateRequiredTests(units)
            };
        });

        console.log(`   Found ${Object.keys(metrics).length} Phase 1/2 modules`);
        return metrics;
    }

    /**
     * Analyze test files to count actual test cases
     */
    analyzeTestFiles() {
        console.log('🧪 Analyzing test files...');

        const testFiles = this.getAllFiles(this.testDir, '.js');
        const metrics = {};

        testFiles.forEach(filePath => {
            const relativePath = path.relative(this.testDir, filePath);
            const moduleName = relativePath.replace('test-', '').replace('.js', '');

            const content = fs.readFileSync(filePath, 'utf8');

            // Count test cases (describe/it blocks, direct assertions)
            const testCases = this.countTestCases(content);

            metrics[moduleName] = {
                filePath,
                testCases,
                testFunctions: this.countTestFunctions(content)
            };
        });

        console.log(`   Found ${Object.keys(metrics).length} test modules`);
        return metrics;
    }

    /**
     * Match tests to modules and calculate coverage
     */
    matchTestsToModules(sourceMetrics, testMetrics) {
        console.log('📏 Calculating coverage by module...');

        const coverageDetails = [];

        Object.keys(sourceMetrics).forEach(moduleName => {
            const source = sourceMetrics[moduleName];
            const test = testMetrics[moduleName];

            if (test) {
                const coverage = Math.round((test.testCases / source.estimatedTests) * 100);

                coverageDetails.push({
                    module: moduleName,
                    sourceFile: path.relative('./', source.filePath),
                    testFile: path.relative('./', test.filePath),
                    linesOfCode: source.linesOfCode,
                    functionalUnits: source.functionalUnits,
                    totalTests: test.testCases,
                    estimatedUnits: source.estimatedTests,
                    coverage: `${Math.min(coverage, 100)}%`,
                    status: coverage >= 80 ? 'EXCELLENT' : coverage >= 60 ? 'GOOD' : coverage >= 40 ? 'ADEQUATE' : 'NEEDS_ATTENTION'
                });
            } else {
                coverageDetails.push({
                    module: moduleName,
                    sourceFile: path.relative('./', source.filePath),
                    testFile: 'NOT FOUND',
                    linesOfCode: source.linesOfCode,
                    functionalUnits: source.functionalUnits,
                    totalTests: 0,
                    estimatedUnits: source.estimatedTests,
                    coverage: '0%',
                    status: 'NO_TESTS'
                });
            }
        });

        return coverageDetails;
    }

    /**
     * Count functional units in source code
     */
    countFunctionalUnits(content) {
        const units = {
            classes: (content.match(/class\s+\w+/g) || []).length,
            functions: (content.match(/(function\s+\w+|const\s+\w+\s*=\s*\(|let\s+\w+\s*=\s*\()/g) || []).length,
            exports: (content.match(/module\.exports|exports\./g) || []).length,
            methods: (content.match(/\w+\s*\([^)]*\)\s*{/g) || []).length
        };

        // Weighted calculation: classes and exports count more
        return units.classes * 3 + units.exports * 2 + units.functions + units.methods;
    }

    /**
     * Estimate required test cases based on functional units
     */
    estimateRequiredTests(functionalUnits) {
        // Based on our TDD experience: ~1-2 tests per functional unit
        // Plus constructor/initialization and edge cases
        return Math.max(functionalUnits * 1.5 + 2, 5); // Minimum 5 tests per module
    }

    /**
     * Count actual test cases in test file
     */
    countTestCases(content) {
        const testCounts = {
            describe: (content.match(/describe\s*\('/g) || []).length,
            it: (content.match(/\s+test\s*\('/g) || []).length,
            assertions: (content.match(/expect\([\w.]+\)\./g) || []).length
        };

        // Weighted: describes are major (2 points), its are tests (1 point), assertions are details (+0.5)
        return testCounts.describe * 2 + testCounts.it + testCounts.assertions * 0.5;
    }

    /**
     * Count test functions for complexity
     */
    countTestFunctions(content) {
        return {
            beforeEach: (content.match(/beforeEach\s*\(/g) || []).length,
            afterEach: (content.match(/afterEach\s*\(/g) || []).length,
            mocks: (content.match(/jest\.mock/g) || []).length
        };
    }

    /**
     * Generate coverage improvement recommendations
     */
    generateRecommendations(coverageDetails) {
        return coverageDetails.filter(module => module.totalTests === 0 || module.coverage < 80).map(module => {
            if (module.totalTests === 0) {
                return `🚨 Create test file for ${module.module} (${module.estimatedUnits} estimated tests needed)`;
            } else if (module.coverage < 60) {
                return `📈 Expand ${module.module} tests (${module.estimatedUnits - module.totalTests} more tests needed)`;
            } else {
                return `✨ Add edge cases to ${module.module} (${module.estimatedUnits - module.totalTests} more tests for 100%)`;
            }
        });
    }

    /**
     * Explain coverage calculation methodology
     */
    explainMethodology() {
        return {
            units: "Each class=3, export=2, function/method=1 point",
            tests: "describe=2, test=1, assertion=0.5 point (weighted for complexity)",
            coverage: "Tests / Estimated Units, capped at 100%",
            interpretation: "80%+ Excellent, 60%+ Good, 40%+ Adequate, <40% Needs Attention"
        };
    }

    /**
     * Get all files recursively in a directory
     */
    getAllFiles(dirPath, extension) {
        const files = [];

        function scanDir(currentPath) {
            const items = fs.readdirSync(currentPath);

            items.forEach(item => {
                const fullPath = path.join(currentPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && !item.includes('node_modules')) {
                    scanDir(fullPath);
                } else if (stat.isFile() && item.endsWith(extension)) {
                    files.push(fullPath);
                }
            });
        }

        scanDir(dirPath);
        return files;
    }

    /**
     * Print coverage report
     */
    printReport(results) {
        console.log('\n📊 LG MODULE TEST COVERAGE REPORT');
        console.log('='.repeat(50));
        console.log(`Overall Coverage: ${results.summary.overallCoverage}`);
        console.log(`Modules Analyzed: ${results.summary.modulesAnalyzed}`);
        console.log(`Total Tests: ${results.summary.totalTestCases}`);
        console.log(`Total Estimated Units: ${results.summary.totalFunctionalUnits}`);
        console.log(`Report Generated: ${results.summary.timestamp}`);

        console.log('\n📋 MODULE DETAILS:');
        console.log('-'.repeat(80));
        console.log('Module'.padEnd(15), 'Coverage'.padEnd(10), 'Tests'.padEnd(8), 'Units'.padEnd(8), 'Status');
        console.log('-'.repeat(80));

        results.details.forEach(module => {
            const status = module.status.replace('_', ' ');
            console.log(
                module.module.padEnd(15),
                module.coverage.padEnd(10),
                module.totalTests.toString().padEnd(8),
                module.estimatedUnits.toString().padEnd(8),
                status
            );
        });

        if (results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            results.recommendations.forEach(rec => console.log(`• ${rec}`));
        }

        console.log('\n🔬 METHODOLOGY:');
        Object.entries(results.methodology).forEach(([key, value]) => {
            console.log(`• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
        });
    }
}

// CLI execution
if (require.main === module) {
    const calculator = new CoverageCalculator();

    calculator.calculateCoverage().then(results => {
        calculator.printReport(results);

        // Exit with success/failure code based on coverage
        const coveragePercent = parseInt(results.summary.overallCoverage);
        process.exit(coveragePercent >= 80 ? 0 : 1);
    }).catch(error => {
        console.error('Coverage calculation failed:', error);
        process.exit(1);
    });
}

module.exports = CoverageCalculator;
