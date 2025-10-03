const assert = require('assert');

describe('AIController deterministic behavior', function () {
    it('decideVote returns deterministic choice for same seed', function () {
        const AIController = require('../../../src/services/ai/ai_controller');
        const ids = ['a', 'b', 'c', 'd'];
        const ai1 = new AIController({seed: 42});
        const ai2 = new AIController({seed: 42});
        const res1 = ai1.decideVote({type: 'Test', ids});
        const res2 = ai2.decideVote({type: 'Test', ids});
        assert.deepStrictEqual(res1, res2);
    });
});
