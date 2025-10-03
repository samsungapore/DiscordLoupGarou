const sinon = require('sinon');
const assert = require('assert');
const {sendEmbed, editMessage} = require('../../src/utils/message');

describe('message utils', function () {
  it('sendEmbed sends built embed', async function () {
    const channel = { send: sinon.stub().resolves('ok') };
    const embed = { build: () => ({foo: 'bar'}) };
    const result = await sendEmbed(channel, embed);
    assert.strictEqual(result, 'ok');
    sinon.assert.calledWith(channel.send, { embeds: [embed.build()] });
  });

  it('editMessage edits message with built embed', async function () {
    const msg = { edit: sinon.stub().resolves('edited') };
    const embed = { build: () => ({foo: 'bar'}) };
    const result = await editMessage(msg, embed);
    assert.strictEqual(result, 'edited');
    sinon.assert.calledWith(msg.edit, { embeds: [embed.build()] });
  });
});
