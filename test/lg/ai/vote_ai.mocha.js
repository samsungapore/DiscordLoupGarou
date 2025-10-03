const assert = require('assert');

describe('AI Vote integration', function () {
    it('runVote should use AI path when enabled', async function () {
        const {Vote} = require('../../../src/lg/lg_vote');
        const AIController = require('../../../src/services/ai/ai_controller');

        const idsMap = new Map([
            ['u1', 'User 1'],
            ['u2', 'User 2'],
            ['u3', 'User 3'],
        ]);

        const conf = {
            ai: new AIController({seed: 123}),
            getPlayersIdName: () => new Map(idsMap),
            _players: new Map([
                ['u1', {member: {id: 'u1', alive: true}}],
                ['u2', {member: {id: 'u2', alive: true}}],
                ['u3', {member: {id: 'u3', alive: true}}],
            ])
        };

        const dummyChannel = {id: 'c1'};
        const vote = new Vote('Test', conf, 1000, dummyChannel, 1);
        const result = await vote.runVote(['u3']); // exclude u3

        assert.strictEqual(Array.isArray(result), true);
        assert.strictEqual(result.length, 1);
        assert.ok(['u1', 'u2'].includes(result[0]));
    });
});
