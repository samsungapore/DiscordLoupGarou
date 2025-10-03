// TDD: Test LG Logger - following TDD approach

const LgLogger = require('../../src/lg/lg_logger');

describe('LgLogger', () => {
    let originalWarn, originalError, originalInfo, originalDebug;

    beforeEach(() => {
        // Mock console methods to capture output for testing
        originalWarn = console.warn;
        originalError = console.error;
        originalInfo = console.info;
        originalDebug = console.debug;

        console.warn = jest.fn();
        console.error = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();
    });

    afterEach(() => {
        // Restore original console methods
        console.warn = originalWarn;
        console.error = originalError;
        console.info = originalInfo;
        console.debug = originalDebug;
    });

    const mockGameInfo = {
        serverName: 'TestServer',
        gameNb: 42
    };

    describe('Static logging methods', () => {
        test('should export static methods', () => {
            // TDD: Define expected interface
            expect(typeof LgLogger.info).toBe('function');
            expect(typeof LgLogger.warn).toBe('function');
            expect(typeof LgLogger.debug).toBe('function');
            expect(typeof LgLogger.error).toBe('function');
        });

        test('should prefix log messages with game info', () => {
            // TDD: Red - define expected behavior
            const testMessage = 'Test message';

            LgLogger.info(testMessage, mockGameInfo);

            // Check that logger.info was called with prefixed message
            expect(console.info).toHaveBeenCalledWith('TestServer | game 42 | Test message');
        });

        test('should work for all log levels', () => {
            // TDD: Red - define expected behavior
            const testMessage = 'Test level message';

            LgLogger.info(testMessage, mockGameInfo);
            LgLogger.warn(testMessage, mockGameInfo);
            LgLogger.error(testMessage, mockGameInfo);
            LgLogger.debug(testMessage, mockGameInfo);

            expect(console.info).toHaveBeenCalledWith('TestServer | game 42 | Test level message');
            expect(console.warn).toHaveBeenCalledWith('TestServer | game 42 | Test level message');
            expect(console.error).toHaveBeenCalledWith('TestServer | game 42 | Test level message');
            expect(console.debug).toHaveBeenCalledWith('TestServer | game 42 | Test level message');
        });

        test('should handle different game numbers', () => {
            // TDD: Red - define expected behavior
            const message = 'Game test';

            LgLogger.info(message, {serverName: 'ServerA', gameNb: 1});
            LgLogger.info(message, {serverName: 'ServerB', gameNb: 999});

            expect(console.info).toHaveBeenNthCalledWith(1, 'ServerA | game 1 | Game test');
            expect(console.info).toHaveBeenNthCalledWith(2, 'ServerB | game 999 | Game test');
        });

        test('should handle special characters in messages', () => {
            // TDD: Red - define expected behavior
            const specialMessage = 'Message with | special % chars & symbols';

            LgLogger.warn(specialMessage, mockGameInfo);

            expect(console.warn).toHaveBeenCalledWith('TestServer | game 42 | Message with | special % chars & symbols');
        });

        test('should be a singleton class', () => {
            // TDD: Red - define expected behavior
            expect(LgLogger).toBeDefined();
            expect(typeof LgLogger).toBe('function');

            // Should have frozen property to prevent instantiation
            expect(Object.isFrozen(LgLogger)).toBe(true);
        });

        test('should have instance getter', () => {
            // TDD: Red - define expected behavior
            expect(LgLogger.instance).toEqual({lg: 'loupgarou'});
        });
    });
});
