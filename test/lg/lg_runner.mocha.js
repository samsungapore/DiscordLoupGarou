const assert = require('assert');

describe('LG custom runner integration', function () {
    it('should pass all LG module tests from the custom runner', function () {
        this.timeout(10000);
        const {runTests} = require('../run_lg_tests.js');
        const ok = runTests();
        assert.strictEqual(ok, true, 'LG custom runner reported failures');
    });
});
