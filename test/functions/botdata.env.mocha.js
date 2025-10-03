const assert = require('assert');

describe('BotData environment configuration', function () {
    const rawPath = require('path').resolve(__dirname, '../../src/BotData');
    const modulePath = require.resolve(rawPath);
    const managedKeys = ['LG_BOT_TOKEN', 'GOOGLE_API_KEY', 'GOOGLE_SPREADSHEET_ID'];
    let originalEnv;

    beforeEach(function () {
        originalEnv = {...process.env};
        process.env.LG_BOT_TOKEN = 'TEST_TOKEN';
        process.env.GOOGLE_API_KEY = 'TEST_GKEY';
        process.env.GOOGLE_SPREADSHEET_ID = 'TEST_SID';
        delete require.cache[modulePath];
    });

    afterEach(function () {
        // Restore environment
        managedKeys.forEach((k) => {
            if (originalEnv[k] === undefined) delete process.env[k];
            else process.env[k] = originalEnv[k];
        });
        delete require.cache[modulePath];
    });

    it('loads secrets from environment variables', function () {
        const BotData = require(modulePath);
        assert.strictEqual(BotData.BotValues.botToken, 'TEST_TOKEN');
        assert.strictEqual(BotData.GoogleSheet.apiKey, 'TEST_GKEY');
        assert.strictEqual(BotData.GoogleSheet.spreadsheetId, 'TEST_SID');
    });
});
