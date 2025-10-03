const winston = require('../utils/logger');

/**
 * MigrationManager - Manages schema versioning and migrations for LG databases
 * @class
 */
class MigrationManager {

    /**
     * Initializes migration manager with database connection
     * @param {AsyncDatabase} db - Database connection
     * @param {string} targetVersion - Target schema version
     */
    constructor(db, targetVersion = '1.0.0') {
        this.db = db;
        this.targetVersion = targetVersion;
    }

    /**
     * Ensures migrations table exists
     */
    async initializeMigrationsTable() {
        await this.db.run(`CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }

    /**
     * Gets current schema version
     * @returns {string} Current version
     */
    async getCurrentVersion() {
        try {
            const row = await this.db.get('SELECT version FROM migrations ORDER BY applied_at DESC LIMIT 1');
            return row ? row.version : '0.0.0';
        } catch (error) {
            // If table doesn't exist, return initial version
            return '0.0.0';
        }
    }

    /**
     * Applies pending migrations
     */
    async applyMigrations() {
        const currentVersion = await this.getCurrentVersion();

        // For now, we only have version 1.0.0
        if (currentVersion === '0.0.0') {
            await this.ensureLGTable();

            // Record migration
            await this.db.run('INSERT INTO migrations (version) VALUES (?)', ['1.0.0']);
            winston.debug('Applied migration to version 1.0.0');
        }
        // Future migrations would go here
    }

    /**
     * Ensures database has correct schema for LG data
     */
    async ensureLGTable() {
        await this.db.run(`CREATE TABLE IF NOT EXISTS lg (
            id INTEGER PRIMARY KEY DEFAULT 1,
            running BOOLEAN NOT NULL DEFAULT false,
            game TEXT DEFAULT null,
            canRun TEXT DEFAULT '[]',
            stemming TEXT DEFAULT null,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
}

module.exports = MigrationManager;
