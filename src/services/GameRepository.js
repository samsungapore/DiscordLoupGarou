const winston = require('../utils/logger');

/**
 * GameRepository - Abstract data access layer for LG game operations
 * @class
 */
class GameRepository {

    /**
     * Initializes repository with database connection
     * @param {AsyncDatabase} db - Database connection
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Finds game data by ID
     * @param {number} id - Game record ID
     * @returns {Object|null} Game data or null if not found
     */
    async findById(id) {
        const row = await this.db.get('SELECT * FROM lg WHERE id = ?', [id]);
        if (!row) return null;

        return {
            running: Boolean(row.running),
            game: row.game,
            canRun: JSON.parse(row.canRun || '[]'),
            stemming: row.stemming
        };
    }

    /**
     * Saves game data (always uses ID 1 for single-record per game pattern)
     * @param {Object} gameData - Game data to save
     * @returns {number} Number of affected rows
     */
    async save(gameData) {
        const result = await this.db.run(
            `INSERT OR REPLACE INTO lg (id, running, game, canRun, stemming, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [1, gameData.running, gameData.game, JSON.stringify(gameData.canRun), gameData.stemming]
        );
        return result.changes || 1; // affected rows
    }

    /**
     * Updates existing game data
     * @param {number} id - Game record ID
     * @param {Object} gameData - Updated game data
     * @returns {number} Number of affected rows
     */
    async update(id, gameData) {
        const result = await this.db.run(
            `UPDATE lg SET running = ?, game = ?, canRun = ?, stemming = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [gameData.running, gameData.game, JSON.stringify(gameData.canRun), gameData.stemming, id]
        );
        return result.changes;
    }

    /**
     * Deletes game data by ID
     * @param {number} id - Game record ID
     * @returns {boolean} True if deleted, false if not found
     */
    async delete(id) {
        const result = await this.db.run('DELETE FROM lg WHERE id = ?', [id]);
        return result.changes > 0;
    }

    /**
     * Gets the single game record (ID 1) for this database
     * @returns {Object|null} Game data or null if not found
     */
    async findGame() {
        return await this.findById(1);
    }

    /**
     * Gets all games (for testing/debugging)
     * @returns {Array} Array of all game records
     */
    async findAll() {
        const rows = await this.db.all('SELECT * FROM lg ORDER BY id');
        return rows.map(row => ({
            id: row.id,
            running: Boolean(row.running),
            game: row.game,
            canRun: JSON.parse(row.canRun || '[]'),
            stemming: row.stemming,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
    }
}

module.exports = GameRepository;
