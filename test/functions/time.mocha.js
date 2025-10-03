const assert = require('assert');
const timeToString = require('../../src/functions/time');

describe('timeToString', function () {
    it('formats less than one minute', function () {
        const s = timeToString(0.5);
        assert.strictEqual(s, '0m30s');
    });

    it('formats hours and minutes correctly', function () {
        const s = timeToString(61);
        assert.strictEqual(s, '1h1m0s');
    });

    it('formats zero correctly', function () {
        const s = timeToString(0);
        assert.strictEqual(s, '0m0s');
    });
});
