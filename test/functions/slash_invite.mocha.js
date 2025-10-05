const assert = require('assert');
const path = require('path');

const command = require(path.resolve(__dirname, '../../src/slashCommands/invite.js'));
const BotData = require(path.resolve(__dirname, '../../src/BotData.js'));

describe('slashCommands/invite', () => {
  it('replies with LG_BOT_INVITE_LINK when configured', async () => {
    const link = 'https://discord.com/api/oauth2/authorize?client_id=1&scope=bot%20applications.commands&permissions=0';
    BotData.BotValues.botInviteLink = link;
    const interaction = {
      replyCalled: false,
      reply(payload) { this.replyCalled = true; this.payload = payload; return Promise.resolve(); }
    };
    await command.execute(interaction);
    assert.strictEqual(interaction.replyCalled, true);
    assert.strictEqual(interaction.payload.content, link);
    assert.strictEqual(interaction.payload.ephemeral, true);
  });

  it('builds link from bot id when invite link is not set', async () => {
    BotData.BotValues.botInviteLink = '';
    BotData.BotValues.botId = '999';
    const interaction = {
      client: { user: { id: '999' } },
      replyCalled: false,
      reply(payload) { this.replyCalled = true; this.payload = payload; return Promise.resolve(); }
    };
    await command.execute(interaction);
    assert.strictEqual(interaction.replyCalled, true);
    assert.ok(/client_id=999/.test(interaction.payload.content));
    assert.ok(/scope=bot%20applications\.commands/.test(interaction.payload.content));
    assert.ok(/permissions=468839664/.test(interaction.payload.content));
  });
});
