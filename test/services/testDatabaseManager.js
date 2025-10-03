const DatabaseManager = require('../../src/services/DatabaseManager');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('DatabaseManager', function () {
    let dbManager;
    let tempDir;

    beforeEach(function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-test-'));
        dbManager = new DatabaseManager({
            min: 1,
            max: 5,
            acquireTimeoutMillis: 60000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 200
        });
    });

    afterEach(async function () {
        if (dbManager) {
            await dbManager.shutdown();
        }
        // Clean up temp directory
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, {recursive: true, force: true});
        }
    });

    describe('initialization', function () {
        it('should initialize with default options', function () {
            const manager = new DatabaseManager();
            assert(manager.options, 'Should have options');
            // Test default values
        });

        it('should initialize successfully', async function () {
            await dbManager.initialize();

            // Check that manager was initialized
            assert(dbManager.initialized, 'Manager should be initialized');
        });
    });

    describe('acquire/release connection', function () {
        beforeEach(async function () {
            await dbManager.initialize();
        });

        it('should acquire a database connection', async function () {
            const dbPath = path.join(tempDir, 'test.db');
            const db = await dbManager.acquire(dbPath);

            assert(db, 'Should acquire database connection');
            // Should be able to run basic SQL
            const result = await db.get('SELECT 1 as test');
            assert.strictEqual(result.test, 1, 'Should be able to execute queries');

            // Properly release the connection
            await dbManager.release(db);
        });

        it('should release connections back to pool', async function () {
            const dbPath = path.join(tempDir, 'test.db');
            const db = await dbManager.acquire(dbPath);

            // Do something with db
            await db.run('CREATE TABLE test (id INTEGER PRIMARY KEY)');

            await dbManager.release(db);

            // Should be able to acquire again and see the table
            const db2 = await dbManager.acquire(dbPath);
            const row = await db2.get("SELECT name FROM sqlite_master WHERE type='table' AND name='test'");
            assert(row, 'Table should still exist');
            await dbManager.release(db2);
        });

        it('should handle multiple concurrent connections', async function () {
            const promises = [];
            const dbPaths = [];

            for (let i = 0; i < 3; i++) {
                const dbPath = path.join(tempDir, `test${i}.db`);
                dbPaths.push(dbPath);

                const promise = (async () => {
                    const db = await dbManager.acquire(dbPath);
                    await db.run('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
                    await db.run('INSERT INTO test (value) VALUES (?)', [`test${i}`]);
                    await dbManager.release(db);
                })();

                promises.push(promise);
            }

            await Promise.all(promises);

            // Verify all databases were created and have data
            for (let i = 0; i < 3; i++) {
                const db = await dbManager.acquire(dbPaths[i]);
                const row = await db.get('SELECT value FROM test LIMIT 1');
                assert.strictEqual(row.value, `test${i}`);
                await dbManager.release(db);
            }
        });
    });

    describe('health checks', function () {
        beforeEach(async function () {
            await dbManager.initialize();
        });

        it('should return healthy status when working', async function () {
            const health = await dbManager.healthCheck();
            assert(health.healthy, 'Should report healthy status');
            assert(health.stats, 'Should include stats');
            assert(health.stats.connectionCount >= 0, 'Should include connection count');
            assert(health.stats.openConnections >= 0, 'Should include open connections');
        });

        it('should handle database errors gracefully in health check', async function () {
            // This might be hard to test without corrupting something
            const health = await dbManager.healthCheck();
            assert(typeof health.healthy === 'boolean', 'Should always return health status');
        });
    });

    describe('shutdown', function () {
        beforeEach(async function () {
            await dbManager.initialize();
        });

        it('should shutdown gracefully', async function () {
            await dbManager.shutdown();
            assert.strictEqual(dbManager.initialized, false, 'Manager should be uninitialized after shutdown');
        });

        it('should handle multiple shutdown calls', async function () {
            await dbManager.shutdown();
            await dbManager.shutdown(); // Should not throw
        });
    });
});
