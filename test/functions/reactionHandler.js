const {ReactionHandler} = require('../../src/functions/reactionHandler');
const {Message} = require('discord.js');

jest.mock('discord.js', () => ({
    Message: jest.fn().mockImplementation(() => ({
        reactions: {
            cache: new Map(),
            removeAll: jest.fn().mockResolvedValue(true),
        },
        react: jest.fn().mockResolvedValue(true),
        createReactionCollector: jest.fn().mockReturnValue({
            on: jest.fn(),
            stop: jest.fn(),
        }),
    })),
    ReactionCollector: jest.fn(),
}));

describe('ReactionHandler', () => {
    let message;
    let reactionHandler;

    beforeEach(() => {
        message = new Message();
        reactionHandler = new ReactionHandler(message);
    });

    test('constructor initializes correctly', () => {
        expect(reactionHandler.message).toBe(message);
        expect(reactionHandler.reactionList).toEqual([]);
        expect(reactionHandler.collector).toBeUndefined();
    });

    test('removeAllReactions calls message.reactions.removeAll', async () => {
        await reactionHandler.removeAllReactions();
        expect(message.reactions.removeAll).toHaveBeenCalled();
    });

    test('addReactions adds reactions in order', async () => {
        reactionHandler.reactionList = ['👍', '👎'];
        await reactionHandler.addReactions(false);
        expect(message.react).toHaveBeenCalledWith('👍');
        expect(message.react).toHaveBeenCalledWith('👎');
    });

    test('addReactions adds reactions not in order', async () => {
        reactionHandler.reactionList = ['👍', '👎'];
        await reactionHandler.addReactions(true);
        expect(message.react).toHaveBeenCalledWith('👍');
        expect(message.react).toHaveBeenCalledWith('👎');
    });

    test('addReaction adds a single reaction', async () => {
        await reactionHandler.addReaction('👍');
        expect(reactionHandler.reactionList).toContain('👍');
        expect(message.react).toHaveBeenCalledWith('👍');
    });

    test('addReactionList adds multiple reactions', async () => {
        await reactionHandler.addReactionList(['👍', '👎']);
        expect(message.react).toHaveBeenCalledWith('👍');
        expect(message.react).toHaveBeenCalledWith('👎');
    });

    test('removeReaction removes a single reaction', async () => {
        reactionHandler.reactionList = ['👍', '👎'];
        message.reactions.cache.set('👍', {emoji: {name: '👍'}, remove: jest.fn().mockResolvedValue(true)});
        await reactionHandler.removeReaction('👍');
        expect(reactionHandler.reactionList).not.toContain('👍');
        expect(message.reactions.cache.get('👍').remove).toHaveBeenCalled();
    });

    test('removeReactionList removes multiple reactions', async () => {
        reactionHandler.reactionList = ['👍', '👎'];
        message.reactions.cache.set('👍', {emoji: {name: '👍'}, remove: jest.fn().mockResolvedValue(true)});
        message.reactions.cache.set('👎', {emoji: {name: '👎'}, remove: jest.fn().mockResolvedValue(true)});
        await reactionHandler.removeReactionList(['👍', '👎']);
        expect(reactionHandler.reactionList).not.toContain('👍');
        expect(reactionHandler.reactionList).not.toContain('👎');
        expect(message.reactions.cache.get('👍').remove).toHaveBeenCalled();
        expect(message.reactions.cache.get('👎').remove).toHaveBeenCalled();
    });

    test('initCollector initializes a reaction collector', () => {
        const func = jest.fn();
        const endFunc = jest.fn();
        const filter = jest.fn();
        const options = {time: 10000};

        reactionHandler.initCollector(func, endFunc, filter, options);
        expect(message.createReactionCollector).toHaveBeenCalledWith({filter, ...options});
        expect(reactionHandler.collector.on).toHaveBeenCalledWith('collect', func);
        expect(reactionHandler.collector.on).toHaveBeenCalledWith('end', endFunc);
    });

    test('stop calls collector.stop', () => {
        reactionHandler.collector = {stop: jest.fn()};
        reactionHandler.stop();
        expect(reactionHandler.collector.stop).toHaveBeenCalled();
    });
});