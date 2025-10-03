const DataValidationService = require('../../src/services/DataValidationService');
const assert = require('assert');

describe('DataValidationService', function () {
    let validationService;

    beforeEach(function () {
        validationService = new DataValidationService();
    });

    describe('validateGameData', function () {
        it('should accept valid game data', function () {
            const validData = {
                running: false,
                game: null,
                canRun: [],
                stemming: null
            };

            assert.doesNotThrow(() => validationService.validateGameData(validData));
        });

        it('should reject invalid running value (non-boolean)', function () {
            const invalidData = {
                running: 'invalid',
                game: null,
                canRun: [],
                stemming: null
            };

            assert.throws(() => validationService.validateGameData(invalidData),
                /Invalid LG data: running must be boolean/);
        });

        it('should reject invalid game value (non-string/non-null)', function () {
            const invalidData = {
                running: false,
                game: 123,
                canRun: [],
                stemming: null
            };

            assert.throws(() => validationService.validateGameData(invalidData),
                /Invalid LG data: game must be string or null/);
        });

        it('should reject invalid canRun value (non-array)', function () {
            const invalidData = {
                running: false,
                game: null,
                canRun: 'invalid',
                stemming: null
            };

            assert.throws(() => validationService.validateGameData(invalidData),
                /Invalid LG data: canRun must be an array/);
        });

        it('should reject invalid stemming value (non-string/non-null)', function () {
            const invalidData = {
                running: false,
                game: null,
                canRun: [],
                stemming: {}
            };

            assert.throws(() => validationService.validateGameData(invalidData),
                /Invalid LG data: stemming must be string or null/);
        });

        it('should reject null or undefined gameData', function () {
            assert.throws(() => validationService.validateGameData(null),
                /Invalid LG data: must be an object/);

            assert.throws(() => validationService.validateGameData(undefined),
                /Invalid LG data: must be an object/);
        });
    });

    describe('validateGameKey', function () {
        it('should accept valid game keys', function () {
            const validKeys = ['game1', 'myGame', 'test_game'];

            validKeys.forEach(key => {
                assert.doesNotThrow(() => validationService.validateGameKey(key));
            });
        });

        it('should reject invalid game keys', function () {
            const invalidKeys = [
                '',
                '../../../invalid/path',
                'game/with/slashes',
                'game\\with\\backslashes',
                'game:with:colons'
            ];

            invalidKeys.forEach(key => {
                assert.throws(() => validationService.validateGameKey(key),
                    /Invalid game key/);
            });
        });

        it('should reject non-string keys', function () {
            assert.throws(() => validationService.validateGameKey(123),
                /Invalid game key: must be non-empty string/);

            assert.throws(() => validationService.validateGameKey(null),
                /Invalid game key: must be non-empty string/);
        });
    });
});
