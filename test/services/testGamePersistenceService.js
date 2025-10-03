const GamePersistenceService = require('../../src/services/GamePersistenceService');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

describe('GamePersistenceService', function () {
    let persistenceService;
    let tempDir;

    beforeEach(async function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'persistence-test-'));

        // Override data directory for tests
        persistenceService = new GamePersistenceService({
            dataDir: tempDir
        });

        await persistenceService.initialize();
    });

    afterEach(async function () {
        await persistenceService.shutdown();

        // Clean up temp directory
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, {recursive: true, force: true});
        }
    });

    describe('initialization', function () {
        it('should initialize with default data directory', async function () {
            const service = new GamePersistenceService();
            await service.initialize();

            assert(service.dataDir, 'Should have data directory');
            await service.shutdown();
        });

        it('should initialize with custom data directory', async function () {
            assert.strictEqual(persistenceService.dataDir, tempDir, 'Should use custom data directory');
        });
    });

    describe('persistAll integration', function () {
        it('should persist multiple games successfully', async function () {
            const gameMap = new Map([
                ['game1', {running: true, game: 'ActiveGame1', canRun: ['player1'], stemming: null}],
                ['game2', {running: false, game: null, canRun: [], stemming: 'test'}]
            ]);

            await persistenceService.persistAll(gameMap);

            // Verify data was persisted
            const dbPath1 = path.join(tempDir, 'game1.db');
            const dbPath2 = path.join(tempDir, 'game2.db');

            assert(fs.existsSync(dbPath1), 'Game1 database should exist');
            assert(fs.existsSync(dbPath2), 'Game2 database should exist');

            // Load and verify data
            const loadedData1 = await persistenceService.loadGame('game1');
            const loadedData2 = await persistenceService.loadGame('game2');

            assert.deepStrictEqual(loadedData1, gameMap.get('game1'), 'Game1 data should match');
            assert.deepStrictEqual(loadedData2, gameMap.get('game2'), 'Game2 data should match');
        });

        it('should update existing game data', async function () {
            const gameKey = 'updateTest';
            const initialData = {running: false, game: null, canRun: [], stemming: null};
            const updatedData = {running: true, game: 'Updated', canRun: ['p1', 'p2'], stemming: 'new'};

            // Initial persist
            await persistenceService.persistAll(new Map([[gameKey, initialData]]));

            // Update persist
            await persistenceService.persistAll(new Map([[gameKey, updatedData]]));

            // Verify update
            const loadedData = await persistenceService.loadGame(gameKey);
            assert.deepStrictEqual(loadedData, updatedData, 'Data should be updated');
        });

        it('should handle validation errors gracefully', async function () {
            const gameMap = new Map([
                ['valid', {running: true, game: 'Valid', canRun: [], stemming: null}],
                ['invalid', {running: 'not_boolean', game: null, canRun: [], stemming: null}]
            ]);

            await assert.rejects(
                async () => await persistenceService.persistAll(gameMap),
                /Invalid LG data: running must be boolean/
            );

            // Valid game should still be persisted
            const loadedData = await persistenceService.loadGame('valid');
            assert.deepStrictEqual(loadedData, gameMap.get('valid'), 'Valid game should be saved');
        });

        it('should handle invalid game keys', async function () {
            const gameMap = new Map([
                ['../../../invalid', {running: false, game: null, canRun: [], stemming: null}]
            ]);

            await assert.rejects(
                async () => await persistenceService.persistAll(gameMap),
                /Invalid game key: contains potentially harmful characters/
            );
        });
    });

    describe('loadGame integration', function () {
        it('should return null for non-existent games', async function () {
            const result = await persistenceService.loadGame('nonexistent');
            assert.strictEqual(result, null, 'Should return null for non-existent game');
        });

        it('should load persisted game data correctly', async function () {
            const gameKey = 'loadTest';
            const gameData = {running: true, game: 'LoadTest', canRun: ['a', 'b'], stemming: 'load'};

            await persistenceService.persistAll(new Map([[gameKey, gameData]]));

            const loadedData = await persistenceService.loadGame(gameKey);
            assert.deepStrictEqual(loadedData, gameData, 'Loaded data should match original');
        });
    });

    describe('concurrent operations', function () {
        it('should handle concurrent persist operations', async function () {
            const promises = [];
            const data = {running: false, game: null, canRun: [], stemming: null};

            for (let i = 0; i < 5; i++) {
                const gameMap = new Map([[`concurrent${i}`, {...data, stemming: `test${i}`}]]);
                promises.push(persistenceService.persistAll(gameMap));
            }

            await Promise.all(promises);

            // Verify all games were saved
            for (let i = 0; i < 5; i++) {
                const loaded = await persistenceService.loadGame(`concurrent${i}`);
                assert(loaded, `Game concurrent${i} should exist`);
                assert.strictEqual(loaded.stemming, `test${i}`, 'Stemming should match');
            }
        });
    });

    describe('shutdown', function () {
        it('should shutdown gracefully', async function () {
            await persistenceService.shutdown();
            // Should not throw any errors
        });

        it('should handle multiple shutdown calls', async function () {
            await persistenceService.shutdown();
            await persistenceService.shutdown(); // Should not throw
        });
    });
});
