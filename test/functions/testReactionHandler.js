const assert = require('assert');
const sinon = require('sinon');
const {ReactionHandler} = require('../../src/functions/reactionHandler');

describe('ReactionHandler', function () {
  let message;
  beforeEach(function () {
    message = {
      reactions: {
        cache: new Map(),
        removeAll: sinon.stub().resolves(true)
      },
      react: sinon.stub().resolves(true),
      createReactionCollector: sinon.stub().returns({
        on: sinon.stub()
      })
    };
  });

  it('removeAllReactions calls removeAll on message', async function () {
    const handler = new ReactionHandler(message);
    await handler.removeAllReactions();
    sinon.assert.calledOnce(message.reactions.removeAll);
  });

  it('addReaction stores reaction and calls message.react', async function () {
    const handler = new ReactionHandler(message);
    await handler.addReaction('👍');
    assert.strictEqual(handler.reactionList.includes('👍'), true);
    sinon.assert.calledWith(message.react, '👍');
  });

  it('addReactions reacts to each emoji sequentially', async function () {
    const handler = new ReactionHandler(message, ['1','2']);
    await handler.addReactions();
    sinon.assert.calledTwice(message.react);
    sinon.assert.calledWith(message.react.firstCall, '1');
    sinon.assert.calledWith(message.react.secondCall, '2');
  });

  it('removeReaction removes reaction from list and message cache', async function () {
    const handler = new ReactionHandler(message, ['a']);
    const emojiObj = {emoji:{name:'a'}, remove: sinon.stub().resolves(true)};
    message.reactions.cache.set('a', emojiObj);
    await handler.removeReaction('a');
    assert.strictEqual(handler.reactionList.includes('a'), false);
    sinon.assert.calledOnce(emojiObj.remove);
  });

  it('initCollector sets up collector and returns handler', function () {
    const handler = new ReactionHandler(message);
    const result = handler.initCollector(()=>{}, ()=>{}, null, {time:1000});
    sinon.assert.calledOnce(message.createReactionCollector);
    assert.strictEqual(result, handler);
  });
});
