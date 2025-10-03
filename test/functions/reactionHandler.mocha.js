const assert = require('assert');
const {ReactionHandler} = require('../../src/functions/reactionHandler');

function createStubMessage() {
    const calls = {react: [], on: []};

    const message = {
        reactions: {
            cache: new Map(),
            removeAll: async () => true,
        },
        react: async (emoji) => {
            calls.react.push(emoji);
            return true;
        },
        createReactionCollector: ({filter, ...options}) => {
            const collector = {
                on: (event, handler) => calls.on.push({event, handler}),
                stop: () => {
                    collector.stopped = true;
                },
                stopped: false,
            };
            return collector;
        },
    };

    return {message, calls};
}

describe('ReactionHandler (Mocha)', function () {
    it('constructor initializes correctly', function () {
        const {message} = createStubMessage();
        const rh = new ReactionHandler(message);
        assert.strictEqual(rh.message, message);
        assert.deepStrictEqual(rh.reactionList, []);
        assert.strictEqual(rh.collector, undefined);
    });

    it('removeAllReactions calls message.reactions.removeAll', async function () {
        let called = false;
        const {message} = createStubMessage();
        message.reactions.removeAll = async () => {
            called = true;
            return true;
        };
        const rh = new ReactionHandler(message);
        await rh.removeAllReactions();
        assert.strictEqual(called, true);
    });

    it('addReactions adds reactions in order', async function () {
        const {message, calls} = createStubMessage();
        const rh = new ReactionHandler(message, ['👍', '👎']);
        await rh.addReactions(false);
        assert.deepStrictEqual(calls.react, ['👍', '👎']);
    });

    it('addReactions adds reactions not in order (parallel)', async function () {
        const {message, calls} = createStubMessage();
        const rh = new ReactionHandler(message, ['👍', '👎']);
        await rh.addReactions(true);
        // Both emojis must be present
        assert(calls.react.includes('👍'));
        assert(calls.react.includes('👎'));
    });

    it('addReaction adds a single reaction', async function () {
        const {message, calls} = createStubMessage();
        const rh = new ReactionHandler(message);
        await rh.addReaction('👍');
        assert(rh.reactionList.includes('👍'));
        assert.deepStrictEqual(calls.react, ['👍']);
    });

    it('addReactionList adds multiple reactions', async function () {
        const {message, calls} = createStubMessage();
        const rh = new ReactionHandler(message);
        await rh.addReactionList(['👍', '👎']);
        assert(calls.react.includes('👍'));
        assert(calls.react.includes('👎'));
    });

    it('removeReaction removes a single reaction and calls underlying remove()', async function () {
        const {message} = createStubMessage();
        const removed = {val: false};
        message.reactions.cache.set('👍', {
            emoji: {name: '👍'}, remove: async () => {
                removed.val = true;
            }
        });
        const rh = new ReactionHandler(message, ['👍', '👎']);
        await rh.removeReaction('👍');
        assert.strictEqual(rh.reactionList.includes('👍'), false);
        assert.strictEqual(removed.val, true);
    });

    it('removeReactionList removes multiple reactions', async function () {
        const {message} = createStubMessage();
        const calls = {up: 0, down: 0};
        message.reactions.cache.set('👍', {
            emoji: {name: '👍'}, remove: async () => {
                calls.up++;
            }
        });
        message.reactions.cache.set('👎', {
            emoji: {name: '👎'}, remove: async () => {
                calls.down++;
            }
        });
        const rh = new ReactionHandler(message, ['👍', '👎']);
        await rh.removeReactionList(['👍', '👎']);
        assert.strictEqual(rh.reactionList.includes('👍'), false);
        assert.strictEqual(rh.reactionList.includes('👎'), false);
        assert.strictEqual(calls.up, 1);
        assert.strictEqual(calls.down, 1);
    });

    it('initCollector initializes collector and registers handlers', function () {
        const {message, calls} = createStubMessage();
        const rh = new ReactionHandler(message);
        const collectFn = () => {
        };
        const endFn = () => {
        };
        const filter = () => true;
        rh.initCollector(collectFn, endFn, filter, {time: 1000});
        assert.ok(rh.collector);
        const events = calls.on.map(o => o.event);
        assert(events.includes('collect'));
        assert(events.includes('end'));
    });

    it('stop calls collector.stop', function () {
        const {message} = createStubMessage();
        const rh = new ReactionHandler(message);
        rh.initCollector(() => {
        }, () => {
        }, () => true, {});
        rh.stop();
        assert.strictEqual(rh.collector.stopped, true);
    });
});
