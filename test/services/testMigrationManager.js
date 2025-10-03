const MigrationManager = require('../../src/services/MigrationManager');
const DatabaseManager = require('../../src/services/DatabaseManager');
const {AsyncDatabase} = require('promised-sqlite3');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('MigrationManager', function () {
    let migrationManager;
    let dbManager;
    let db;
    let tempDir;

    beforeEach(async function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-test-'));
        const dbPath = path.join(tempDir, 'test.db');

        db = await AsyncDatabase.open(dbPath);
        migrationManager = new MigrationManager(db, '1.0.0');
    });

    afterEach(async function () {
        if (db) {
            await db.close();
        }
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, {recursive: true, force: true});
        }
    });

    describe('initialization', function () {
        it('should create migration manager with database connection', function () {
            assert(migrationManager.db, 'Should have database connection');
            assert.strictEqual(migrationManager.targetVersion, '1.0.0');
        });
    });

    describe('migrations table', function () {
        it('should create migrations table if it does not exist', async function () {
            await migrationManager.initializeMigrationsTable();

            const row = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
            assert(row, 'Migrations table should exist');
        });

        it('should handle already existing migrations table', async function () {
            await migrationManager.initializeMigrationsTable();
            await migrationManager.initializeMigrationsTable(); // Should not throw
        });
    });

    describe('version management', function () {
        it('should get current version from empty database', async function () {
            const version = await migrationManager.getCurrentVersion();
            assert.strictEqual(version, '0.0.0', 'Should return initial version');
        });

        it('should get current version after setting', async function () {
            await migrationManager.initializeMigrationsTable();

            // Manually insert a version
            await db.run("INSERT INTO migrations (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)", ['1.0.0']);

            const version = await migrationManager.getCurrentVersion();
            assert.strictEqual(version, '1.0.0');
        });
    });

    describe('LG table management', function () {
        it('should create LG table with correct schema', async function () {
            await migrationManager.ensureLGTable();

            const row = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='lg'");
            assert(row, 'LG table should exist');

            // Check schema
            const columns = await db.all("PRAGMA table_info(lg)");
            const expectedColumns = ['id', 'running', 'game', 'canRun', 'stemming', 'created_at', 'updated_at'];
            const actualColumns = columns.map(col => col.name);

            expectedColumns.forEach(col => {
                assert(actualColumns.includes(col), `Column ${col} should exist`);
            });
        });

        it('should handle already existing LG table', async function () {
            await migrationManager.ensureLGTable();
            await migrationManager.ensureLGTable(); // Should not throw
        });
    });

    describe('migration application', function () {
        it('should apply initial migration', async function () {
            await migrationManager.initializeMigrationsTable();
            await migrationManager.applyMigrations();

            const version = await migrationManager.getCurrentVersion();
            assert.strictEqual(version, '1.0.0', 'Should apply version 1.0.0');
        });

        it('should handle already applied migrations', async function () {
            await migrationManager.initializeMigrationsTable();
            await migrationManager.applyMigrations();
            await migrationManager.applyMigrations(); // Should not throw
        });
    });
});
