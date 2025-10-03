const Discord = require('discord.js');
const GamePersistenceService = require('./services/GamePersistenceService');

class LGDB extends Discord.Client {
    constructor(clientOptions) {
        super(clientOptions);
        this.Settings = new Map();
        this.LG = new Map();
        this.commands = new Discord.Collection();
        this.persistenceService = new GamePersistenceService();
    }

    init() {
        this.initCommands();
        this.initServices();

        return this;
    }

    initCommands() {
        const fs = require('graceful-fs');
        for (const file of fs.readdirSync('./src/commands')) {
            const command = require(`./commands/${file}`);
            this.commands.set(command.name, command);
        }

        return this;
    }

    initServices() {
        // Initialize persistence service
        this.persistenceService.initialize();

        return this;
    }

    /**
     * @brief Persists all data of the Bot to database files
     */
    async persist() {
        // Lazy initialize if not done through init()
        if (!this.persistenceService) {
            this.persistenceService = new GamePersistenceService();
        }

        // Ensure service is initialized
        try {
            await this.persistenceService.initialize();
        } catch (error) {
            // Already initialized, continue
        }

        await this.persistenceService.persistAll(this.LG);

        // Close any open DB connections to avoid file locks in short-lived contexts/tests
        try {
            await this.persistenceService.shutdown();
        } catch (e) {
            // ignore shutdown errors
        }
    }
}

const path = require('path');
const fs = require('fs');
const winston = require('./utils/logger');

// import sqlite3 promisified
const {AsyncDatabase} = require("promised-sqlite3");

/**
 * Validates a single LG game data object
 * @param {Object} gameData - The game data to validate
 * @throws {Error} If validation fails
 */
function validateGameData(gameData) {
    if (typeof gameData !== 'object' || gameData === null) {
        throw new Error('Invalid LG data: must be an object');
    }

    if (typeof gameData.running !== 'boolean') {
        throw new Error('Invalid LG data: running must be boolean');
    }

    if (gameData.game !== null && typeof gameData.game !== 'string') {
        throw new Error('Invalid LG data: game must be string or null');
    }

    if (!Array.isArray(gameData.canRun)) {
        throw new Error('Invalid LG data: canRun must be an array');
    }

    if (gameData.stemming !== null && typeof gameData.stemming !== 'string') {
        throw new Error('Invalid LG data: stemming must be string or null');
    }
}

/**
 * Validates a game key for path traversal safety
 * @param {string} key - The game key to validate
 * @throws {Error} If key is invalid
 */
function validateGameKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
        throw new Error('Invalid game key: must be non-empty string');
    }

    // Prevent path traversal attacks
    if (key.includes('..') || key.includes('/') || key.includes('\\') || key.includes(':')) {
        throw new Error('Invalid game key: contains potentially harmful characters');
    }
}

/**
 * Sanitizes LG data for logging by redacting sensitive information
 * @param {Map} lgMap - The LG Map to sanitize
 * @returns {string} Safe representation for logging
 */
function sanitizeLGForLogging(lgMap) {
    const entries = [];
    for (let [key] of lgMap.entries()) {
        entries.push(`${key}: {running: boolean, game: string, canRun: array(${lgMap.get(key).canRun.length}), stemming: string}`);
    }
    return `LG entries: [${entries.join(', ')}]`;
}

/**
 * Ensured database table exists with correct schema
 * @param {AsyncDatabase} db - The database connection
 */
async function ensureLGTable(db) {
    await db.run(`CREATE TABLE IF NOT EXISTS lg (
        id INTEGER PRIMARY KEY DEFAULT 1,
        running BOOLEAN NOT NULL DEFAULT false,
        game TEXT DEFAULT null,
        canRun TEXT DEFAULT '[]',
        stemming TEXT DEFAULT null,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

/**
 * Persists LG game data to database with upsert behavior and proper error handling
 * @param {Map<string, Object>} LG - Map of game data keyed by game identifier
 */
async function persistLGData(LG = new Map()) {
    const dataDir = process.env.LG_DATA_DIR || './data/lg';

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {recursive: true});
    }

    winston.info(`Persisting LG data to database: ${sanitizeLGForLogging(LG)}`);

    const promises = [];

    for (let [key, value] of Array.from(LG.entries())) {
        // Validate inputs
        try {
            validateGameKey(key);
            validateGameData(value);
        } catch (validationError) {
            winston.error(`Validation failed for game '${key}': ${validationError.message}`);
            throw validationError;
        }

        // Process each game concurrently
        const promise = (async () => {
            let db = null;
            try {
                const dbPath = path.join(dataDir, `${key}.db`);
                db = await AsyncDatabase.open(dbPath);

                // Start transaction
                await db.run('BEGIN TRANSACTION');

                // Ensure table exists
                await ensureLGTable(db);

                // Upsert the data (INSERT OR REPLACE)
                await db.run(
                    `INSERT
                    OR REPLACE INTO lg (id, running, game, canRun, stemming, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [1, value.running, value.game, JSON.stringify(value.canRun), value.stemming]
                );

                // Commit transaction
                await db.run('COMMIT');

                winston.debug(`Successfully persisted data for game '${key}'`);
            } catch (error) {
                if (db) {
                    try {
                        await db.run('ROLLBACK');
                    } catch (rollbackError) {
                        winston.error(`Failed to rollback transaction for game '${key}': ${rollbackError.message}`);
                    }
                }
                winston.error(`Failed to persist data for game '${key}': ${error.message}`);
                throw error;
            } finally {
                if (db) {
                    try {
                        await db.close();
                    } catch (closeError) {
                        winston.error(`Failed to close database for game '${key}': ${closeError.message}`);
                    }
                }
            }
        })();

        promises.push(promise);
    }

    // Wait for all operations to complete
    await Promise.all(promises);
}

module.exports = {
    LGDB,
    persistFunctions: {
        persistLGData
    }
};
