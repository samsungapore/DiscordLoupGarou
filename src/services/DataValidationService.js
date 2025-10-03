/**
 * DataValidationService - Centralized validation logic for LG game data
 *
 * Provides validation functions for game data objects and game keys to ensure
 * data integrity and prevent security issues like path traversal attacks.
 *
 * @example
 * const validator = new DataValidationService();
 *
 * // Validate game data
 * const gameData = { running: true, game: 'MyGame', canRun: ['player1'], stemming: null };
 * validator.validateGameData(gameData); // No error thrown
 *
 * // Validate game key
 * validator.validateGameKey('validGameName'); // No error thrown
 * validator.validateGameKey('../../../invalid'); // Throws error
 * @class
 */
class DataValidationService {

    /**
     * Validates a single LG game data object
     * @param {Object} gameData - The game data to validate
     * @throws {Error} If validation fails
     */
    validateGameData(gameData) {
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
    validateGameKey(key) {
        if (typeof key !== 'string' || key.length === 0) {
            throw new Error('Invalid game key: must be non-empty string');
        }

        // Prevent path traversal attacks
        if (key.includes('..') || key.includes('/') || key.includes('\\') || key.includes(':')) {
            throw new Error('Invalid game key: contains potentially harmful characters');
        }
    }
}

module.exports = DataValidationService;
