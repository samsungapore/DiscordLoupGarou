const DatabaseManager = require('./DatabaseManager');
const MigrationManager = require('./MigrationManager');
const GameRepository = require('./GameRepository');
const DataValidationService = require('./DataValidationService');
const winston = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * GamePersistenceService - Orchestrates game data persistence operations
 * @class
 */
class GamePersistenceService {
    constructor(options = {}) {
        this.databaseManager = new DatabaseManager(options.database);
        this.dataValidationService = new DataValidationService();
        this.dataDir = options.dataDir || process.env.LG_DATA_DIR || './data/lg';
    }

    /**
     * Initializes the service
     */
    async initialize() {
        await this.databaseManager.initialize();
    }

    /**
     * Persists all game data from a Map
     * @param {Map<string, Object>} gameMap - Map of game data keyed by identifier
     */
    async persistAll(gameMap = new Map()) {
        winston.info(`Persisting LG data to database: ${this._sanitizeLGForLogging(gameMap)}`);

        const promises = [];
        const errors = [];

        for (let [key, value] of Array.from(gameMap.entries())) {
            // Validate inputs per game
            try {
                this.dataValidationService.validateGameKey(key);
                this.dataValidationService.validateGameData(value);
            } catch (validationError) {
                winston.error(`Validation failed for game '${key}': ${validationError.message}`);
                errors.push(validationError);
                continue; // Skip this game but continue with others
            }

            // Process each valid game concurrently
            const promise = this._persistGame(key, value).catch(error => {
                winston.error(`Failed to persist valid game '${key}': ${error.message}`);
                errors.push(error);
            });
            promises.push(promise);
        }

        // Wait for all operations to complete
        await Promise.all(promises);

        // If there were any errors, throw an aggregate error
        if (errors.length > 0) {
            const errorMessages = errors.map(e => e.message).join('; ');
            throw new Error(`Some games failed to persist: ${errorMessages}`);
        }
    }

    /**
     * Persists a single game
     * @param {string} gameKey - Game identifier
     * @param {Object} gameData - Game data to persist
     */
    async _persistGame(gameKey, gameData) {
        const dbPath = path.join(this.dataDir, `${gameKey}.db`);

        try {
            // Get database connection
            const db = await this.databaseManager.acquire(dbPath);

            // Run migrations if needed
            const migrationManager = new MigrationManager(db);
            await migrationManager.initializeMigrationsTable();

            const currentVersion = await migrationManager.getCurrentVersion();
            if (currentVersion === '0.0.0') {
                await migrationManager.applyMigrations();
            }

            // Persist data
            const repository = new GameRepository(db);
            await repository.save(gameData);

            // Release connection
            await this.databaseManager.release(db);

            winston.debug(`Successfully persisted data for game '${gameKey}'`);
        } catch (error) {
            winston.error(`Failed to persist data for game '${gameKey}': ${error.message}`);
            throw error;
        }
    }

    /**
     * Loads game data by key
     * @param {string} gameKey - Game identifier
     * @returns {Object|null} Game data or null if not found
     */
    async loadGame(gameKey) {
        this.dataValidationService.validateGameKey(gameKey);

        const dbPath = path.join(this.dataDir, `${gameKey}.db`);

        // Check if database file exists
        if (!fs.existsSync(dbPath)) {
            return null;
        }

        const db = await this.databaseManager.acquire(dbPath);

        try {
            const repository = new GameRepository(db);
            const gameData = await repository.findGame();

            await this.databaseManager.release(db);
            return gameData;
        } catch (error) {
            await this.databaseManager.release(db);
            throw error;
        }
    }

    /**
     * Sanitizes LG data for logging
     * @param {Map} lgMap - The LG Map to sanitize
     * @returns {string} Safe representation for logging
     */
    _sanitizeLGForLogging(lgMap) {
        const entries = [];
        for (let [key] of lgMap.entries()) {
            entries.push(`${key}: {running: boolean, game: string, canRun: array, stemming: string}`);
        }
        return `LG entries: [${entries.join(', ')}]`;
    }

    /**
     * Shuts down the service
     */
    async shutdown() {
        await this.databaseManager.shutdown();
    }
}

module.exports = GamePersistenceService;
