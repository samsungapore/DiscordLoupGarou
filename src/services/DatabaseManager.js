const {AsyncDatabase} = require('promised-sqlite3');
const winston = require('../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * DatabaseManager - Handles SQLite database connections and basic pooling
 * @class
 */
class DatabaseManager {
    constructor(options = {}) {
        this.initialized = false;
        this.openConnections = new Map(); // dbPath -> AsyncDatabase
        this.connectionCount = 0;
        this.maxConnections = options.max || 10;
        this.options = options; // Store options for testing
        this.pendingOperations = new Set(); // Track pending operations for simple concurrency control
    }

    /**
     * Initializes the database manager
     */
    async initialize() {
        this.initialized = true;
        winston.debug('Database manager initialized');
    }

    /**
     * Gets or creates a database connection for the specified path
     * @param {string} dbPath - Path to the database file
     * @returns {AsyncDatabase} Database connection
     */
    async acquire(dbPath) {
        if (!this.initialized) {
            throw new Error('Database manager not initialized. Call initialize() first.');
        }

        if (this.connectionCount >= this.maxConnections) {
            throw new Error('Maximum connections reached');
        }

        // Ensure directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, {recursive: true});
        }

        // Return existing connection if available
        if (this.openConnections.has(dbPath)) {
            return this.openConnections.get(dbPath);
        }

        try {
            const db = await AsyncDatabase.open(dbPath);
            this.openConnections.set(dbPath, db);
            this.connectionCount++;
            return db;
        } catch (error) {
            throw new Error(`Failed to open database at ${dbPath}: ${error.message}`);
        }
    }

    /**
     * Releases a database connection (connection stays open for reuse)
     * @param {AsyncDatabase} db - Database connection to release (kept for reuse)
     */
    async release(db) {
        // For now, we keep connections open to reuse them
        // In a real implementation, we might have LRU eviction
        // Connection will be closed during shutdown
    }

    /**
     * Performs health checks
     * @returns {Object} Health status
     */
    async healthCheck() {
        if (!this.initialized) {
            return {healthy: false, error: 'Manager not initialized'};
        }

        try {
            // Try a simple test query on a temporary in-memory database
            const testDb = await AsyncDatabase.open(':memory:');
            const result = await testDb.get('SELECT 1 as test');
            await testDb.close();

            const stats = {
                connectionCount: this.connectionCount,
                maxConnections: this.maxConnections,
                openConnections: this.openConnections.size
            };

            return {
                healthy: result.test === 1,
                stats,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            winston.error(`Health check failed: ${error.message}`);
            return {
                healthy: false,
                error: error.message,
                stats: {
                    connectionCount: this.connectionCount,
                    openConnections: this.openConnections.size
                }
            };
        }
    }

    /**
     * Shuts down and closes all connections
     */
    async shutdown() {
        if (this.initialized) {
            // Close all connections
            const closePromises = Array.from(this.openConnections.values()).map(async (db) => {
                try {
                    await db.close();
                } catch (error) {
                    winston.error(`Error closing database during shutdown: ${error.message}`);
                }
            });

            await Promise.all(closePromises);
            this.openConnections.clear();
            this.connectionCount = 0;
            this.initialized = false;
            winston.debug('Database manager shut down');
        }
    }
}

module.exports = DatabaseManager;
