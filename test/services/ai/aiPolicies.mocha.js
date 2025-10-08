const assert = require('assert');

describe('AI deterministic helpers', function () {
    afterEach(function () {
        delete require.cache[require.resolve('../../../src/services/ai/deterministicRng')];
        delete require.cache[require.resolve('../../../src/services/ai/policy')];
    });

    it('mulberry32 produces deterministic sequences for same seed', function () {
        const {mulberry32} = require('../../../src/services/ai/deterministicRng');
        const rng1 = mulberry32(1234);
        const rng2 = mulberry32(1234);
        const seq1 = Array.from({length: 5}, () => rng1());
        const seq2 = Array.from({length: 5}, () => rng2());
        assert.deepStrictEqual(seq1, seq2);
    });

    it('mulberry32 produces different sequences for different seeds', function () {
        const {mulberry32} = require('../../../src/services/ai/deterministicRng');
        const rng1 = mulberry32(1234);
        const rng2 = mulberry32(42);
        assert.notDeepStrictEqual(Array.from({length: 5}, () => rng1()), Array.from({length: 5}, () => rng2()));
    });

    it('mulberry32 defaults to fallback seed when none provided', function () {
        const {mulberry32} = require('../../../src/services/ai/deterministicRng');
        const rng = mulberry32();
        const seq = Array.from({length: 3}, () => rng());
        assert.strictEqual(seq.length, 3);
        seq.forEach(value => {
            assert.ok(value >= 0 && value < 1);
        });
    });

    it('policy helpers choose valid indexes and elements', function () {
        const {pickIndex, chooseOne, decideVoteDefault, decideVoleurPolicy, decideSorcierePolicy, mulberry32} = require('../../../src/services/ai/policy');
        const rng = () => 0.75;
        assert.strictEqual(pickIndex(rng, 4), 3);
        assert.strictEqual(pickIndex(rng, 0), 0);

        const ids = ['a', 'b', 'c'];
        const choice = chooseOne(() => 0.1, ids);
        assert.deepStrictEqual(choice, ['a']);
        assert.deepStrictEqual(chooseOne(() => 0.9, []), []);
        assert.deepStrictEqual(decideVoteDefault({rng: () => 0.5, ids}), ['b']);

        assert.deepStrictEqual(decideVoleurPolicy({rng: mulberry32(1), additionalRoles: ['LoupGarou', 'LoupGarou']}), {keep: false, role: 'LoupGarou'});
        assert.deepStrictEqual(decideVoleurPolicy({rng: mulberry32(1), additionalRoles: ['Villageois', 'LoupGarou']}), {keep: true});

        assert.deepStrictEqual(decideSorcierePolicy({rng: mulberry32(1), lgTargetId: 'self', selfId: 'self'}), {save: true, poisonTarget: null});
        assert.deepStrictEqual(decideSorcierePolicy({rng: mulberry32(1), lgTargetId: 'other', selfId: 'self'}), {save: false, poisonTarget: null});
    });
});

describe('AI controller and virtual members', function () {
    afterEach(function () {
        delete require.cache[require.resolve('../../../src/services/ai/ai_controller')];
        delete require.cache[require.resolve('../../../src/services/ai/virtual_member')];
    });

    it('AI controller delegates to policy helpers', function () {
        const AIController = require('../../../src/services/ai/ai_controller');
        const controller = new AIController({seed: 99});
        const vote = controller.decideVote({ids: ['x', 'y', 'z']});
        assert.strictEqual(vote.length, 1);
        assert.ok(['x', 'y', 'z'].includes(vote[0]));

        const noChoice = controller.decideVote({ids: []});
        assert.deepStrictEqual(noChoice, []);

        const voleurDecision = controller.decideVoleur({additionalRoles: ['LoupGarou', 'LoupGarou']});
        assert.deepStrictEqual(voleurDecision, {keep: false, role: 'LoupGarou'});

        const sorciereDecision = controller.decideSorciere({lgTargetId: 'self', selfId: 'self'});
        assert.deepStrictEqual(sorciereDecision, {save: true, poisonTarget: null});
    });

    it('VirtualMember creates DM channel proxies', async function () {
        const {VirtualMember} = require('../../../src/services/ai/virtual_member');
        const member = new VirtualMember({id: '123', displayName: 'Bot 123'});
        assert.strictEqual(member.isVirtual, true);
        const dm = await member.createDM();
        const response = await dm.send({content: 'hi'});
        assert.strictEqual(response, true);
        const sendResponse = await member.send('hello');
        assert.strictEqual(sendResponse, true);
    });

    it('VirtualMember assigns default display name and avatar helpers', async function () {
        const {VirtualMember} = require('../../../src/services/ai/virtual_member');
        const member = new VirtualMember({id: '456'});
        assert.ok(member.displayName.includes('Bot'));
        const dm = await member.createDM();
        await dm.send({content: 'test'});
        assert.strictEqual(typeof member.user.avatarURL(), 'undefined');
    });
});
