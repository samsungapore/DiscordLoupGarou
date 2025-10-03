const {
    LGDB,
    persistFunctions: {
        persistLGData
    }
} = require('../../src/LGDB');
const Discord = require('discord.js');
const BotData = require('../../src/BotData');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {AsyncDatabase} = require('promised-sqlite3');

// let's test the persistLGData function with mocha

describe('persistLGData', function () {
    let tempDir;

    before(function () {
        // Create temporary directory for tests
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgdb-test-'));
    });

    after(function () {
        // Clean up temporary directory recursively
        function rmDirRecursive(dirPath) {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach((file) => {
                    const curPath = path.join(dirPath, file);
                    if (fs.lstatSync(curPath).isDirectory()) {
                        rmDirRecursive(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(dirPath);
            }
        }

        rmDirRecursive(tempDir);
    });

    beforeEach(function () {
        // Override data path for tests
        this.originalLGDataDir = process.env.LG_DATA_DIR;
        process.env.LG_DATA_DIR = path.join(tempDir, 'lg');
    });

    afterEach(function () {
        // Restore original data path
        process.env.LG_DATA_DIR = this.originalLGDataDir;
    });

    describe('Basic Functionality', function () {
        it('should create database file and persist data on first run', async function () {
            const LG = new Map([['test', {...BotData.LG}]]);
            await persistLGData(LG);

            const dbPath = path.join(tempDir, 'lg', 'test.db');
            assert.ok(fs.existsSync(dbPath), 'Database file should be created');

            // Verify data was persisted
            const db = await AsyncDatabase.open(dbPath);
            const row = await db.get('SELECT * FROM lg LIMIT 1');
            assert.strictEqual(row.running, 0);
            assert.strictEqual(row.game, null);
            assert.deepEqual(JSON.parse(row.canRun), []);
            assert.strictEqual(row.stemming, null);
            await db.close();
        });

        it('should update data on subsequent persists (upsert behavior)', async function () {
            const LG = new Map([['test', {...BotData.LG}]]);
            await persistLGData(LG);

            // Modify data and persist again
            LG.get('test').running = true;
            LG.get('test').game = 'ActiveGame';
            LG.get('test').canRun = ['player1', 'player2'];

            await persistLGData(LG);

            // Verify only one row exists and data is updated
            const dbPath = path.join(tempDir, 'lg', 'test.db');
            const db = await AsyncDatabase.open(dbPath);
            const rows = await db.all('SELECT * FROM lg');

            assert.strictEqual(rows.length, 1, 'Should have exactly one row');
            assert.strictEqual(rows[0].running, 1);
            assert.strictEqual(rows[0].game, 'ActiveGame');
            assert.deepEqual(JSON.parse(rows[0].canRun), ['player1', 'player2']);

            await db.close();
        });
    });

    describe('Data Validation', function () {
        it('should reject invalid running value (non-boolean)', async function () {
            const LG = new Map([['test', {...BotData.LG, running: 'invalid'}]]);
            await assert.rejects(
                async () => await persistLGData(LG),
                /Invalid LG data/
            );
        });

        it('should reject invalid game value (non-string/non-null)', async function () {
            const LG = new Map([['test', {...BotData.LG, game: 123}]]);
            await assert.rejects(
                async () => await persistLGData(LG),
                /Invalid LG data/
            );
        });

        it('should reject invalid canRun value (non-array)', async function () {
            const LG = new Map([['test', {...BotData.LG, canRun: 'invalid'}]]);
            await assert.rejects(
                async () => await persistLGData(LG),
                /Invalid LG data/
            );
        });

        it('should reject invalid stemming value (non-string/non-null)', async function () {
            const LG = new Map([['test', {...BotData.LG, stemming: {}}]]);
            await assert.rejects(
                async () => await persistLGData(LG),
                /Invalid LG data/
            );
        });
    });

    describe('Error Handling and Resource Management', function () {
        it('should handle database errors gracefully', async function () {
            // Create invalid table to force error
            const dbPath = path.join(tempDir, 'lg', 'error.db');
            fs.mkdirSync(path.join(tempDir, 'lg'), {recursive: true});
            const db = await AsyncDatabase.open(dbPath);
            await db.run('CREATE TABLE lg (id INTEGER PRIMARY KEY, running TEXT);'); // Wrong schema
            await db.close();

            const LG = new Map([['error', {...BotData.LG, running: true}]]);

            // Should throw due to invalid table schema
            await assert.rejects(
                async () => await persistLGData(LG),
                /SQLITE_ERROR/
            );
        });

        it('should handle invalid game key gracefully', async function () {
            const LG = new Map([['../../../invalid/path', {...BotData.LG}]]);
            await assert.rejects(
                async () => await persistLGData(LG),
                /Invalid game key/
            );
        });
    });

    describe('Concurrency and Multiple Games', function () {
        it('should handle multiple games concurrently', async function () {
            const LG = new Map([
                ['game1', {...BotData.LG, running: true}],
                ['game2', {...BotData.LG, running: false, game: 'Game2'}]
            ]);

            await persistLGData(LG);

            // Verify both databases created and contain correct data
            const db1 = await AsyncDatabase.open(path.join(tempDir, 'lg', 'game1.db'));
            const row1 = await db1.get('SELECT * FROM lg');
            assert.strictEqual(row1.running, 1);
            await db1.close();

            const db2 = await AsyncDatabase.open(path.join(tempDir, 'lg', 'game2.db'));
            const row2 = await db2.get('SELECT * FROM lg');
            assert.strictEqual(row2.running, 0);
            assert.strictEqual(row2.game, 'Game2');
            await db2.close();
        });
    });

    describe('LGDB Class', function () {
        it('should create LGDB instance with proper initialization', function () {
            const clientOptions = {intents: []};
            const lgdb = new LGDB(clientOptions);

            assert(lgdb instanceof LGDB, 'Should be instance of LGDB');
            assert(lgdb.Settings instanceof Map, 'Settings should be a Map');
            assert(lgdb.LG instanceof Map, 'LG should be a Map');
            assert.equal(lgdb.Settings.size, 0, 'Settings should be empty initially');
            assert.equal(lgdb.LG.size, 0, 'LG should be empty initially');
        });

        it('should persist data through LGDB.persist() method', async function () {
            const clientOptions = {intents: []};
            const lgdb = new LGDB(clientOptions);
            lgdb.LG.set('test', {...BotData.LG, running: true});

            await lgdb.persist();

            const dbPath = path.join(tempDir, 'lg', 'test.db');
            const db = await AsyncDatabase.open(dbPath);
            const row = await db.get('SELECT * FROM lg');
            assert.strictEqual(row.running, 1);
            await db.close();
        });
    });
});
