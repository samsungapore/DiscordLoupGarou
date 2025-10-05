const assert = require('assert');
const path = require('path');

const command = require(path.resolve(__dirname, '../../src/slashCommands/admin-broadcast.js'));

describe('slashCommands/admin-broadcast', () => {
  it('getGuildAdmins includes owner and admins, excludes bots and deduplicates', () => {
    const ownerId = '1';
    const owner = { id: ownerId, user: { bot: false }, permissions: { has: () => false } };
    const adminA = { id: '2', user: { bot: false }, permissions: { has: () => true } };
    const adminBot = { id: '3', user: { bot: true }, permissions: { has: () => true } };
    const member = { id: '4', user: { bot: false }, permissions: { has: () => false } };

    const guild = {
      ownerId,
      members: {
        cache: new Map([
          [ownerId, owner],
          ['2', adminA],
          ['3', adminBot],
          ['4', member],
        ])
      }
    };

    const admins = command._internal.getGuildAdmins(guild);
    assert.strictEqual(admins.has(ownerId), true, 'owner included');
    assert.strictEqual(admins.has('2'), true, 'admin included');
    assert.strictEqual(admins.has('3'), false, 'bot excluded');
    assert.strictEqual(admins.has('4'), false, 'non-admin excluded');
  });

  it('dmMembersSequential counts sent and failed correctly (no delay)', async () => {
    const ok = { send: async () => {} };
    const ko = { send: async () => { throw new Error('dm failed'); } };
    const {attempted, sent, failed} = await command._internal.dmMembersSequential([ok, ko, ok], 'hi', () => Promise.resolve());
    assert.strictEqual(attempted, 3);
    assert.strictEqual(sent, 2);
    assert.strictEqual(failed, 1);
  });

  it('execute enforces owner-only access', async () => {
    const interaction = {
      user: { id: 'someone-else' },
      replyCalled: false,
      reply(payload) { this.replyCalled = true; this.replyPayload = payload; return Promise.resolve(); },
      options: { getString: () => 'x' },
    };
    await command.execute(interaction);
    assert.strictEqual(interaction.replyCalled, true);
    assert.strictEqual(interaction.replyPayload.ephemeral, true);
  });

  it('execute DMs admins across guilds and summarizes result', async () => {
    // stub members
    const mkMember = (id, isAdmin, bot, sendOk = true) => ({
      id,
      user: { bot: !!bot },
      permissions: { has: () => !!isAdmin },
      send: async () => { if (!sendOk) throw new Error('fail'); }
    });

    // guild A: owner + 1 admin
    const guildA = {
      name: 'GuildA',
      ownerId: 'ownerA',
      members: {
        cache: new Map([
          ['ownerA', mkMember('ownerA', false, false, true)],
          ['u1', mkMember('u1', true, false, true)],
          ['bot', mkMember('bot', true, true, true)],
        ])
      },
      members: { // override including fetch()
        cache: new Map([
          ['ownerA', mkMember('ownerA', false, false, true)],
          ['u1', mkMember('u1', true, false, true)],
          ['bot', mkMember('bot', true, true, true)],
        ]),
        fetch: async () => {}
      }
    };

    // guild B: owner only, DM fails
    const guildB = {
      name: 'GuildB',
      ownerId: 'ownerB',
      members: {
        cache: new Map([
          ['ownerB', mkMember('ownerB', false, false, false)],
          ['x', mkMember('x', false, false, false)],
        ]),
        fetch: async () => {}
      }
    };

    const interaction = {
      user: { id: '140033402681163776' },
      client: { guilds: { cache: new Map([['A', guildA], ['B', guildB]]) } },
      options: { getString: () => 'maintenance soon' },
      deferred: false,
      replied: false,
      async deferReply(opts) { this.deferred = true; this.deferOpts = opts; },
      async editReply(content) { this.edited = content; },
    };

    await command.execute(interaction);
    // GuildA: owner + admin => 2 attempts; both OK => 2 sent
    // GuildB: owner only => 1 attempt; fails => 1 failed
    // Total attempted 3, sent 2, failed 1
    assert.ok(/attempted 3/.test(interaction.edited));
    assert.ok(/sent 2/.test(interaction.edited));
    assert.ok(/failed 1/.test(interaction.edited));
  });

  it('execute deduplicates the same user across multiple guilds (one DM total)', async () => {
    let dmCalls = 0;
    const mkMember = (id) => ({
      id,
      user: { bot: false },
      permissions: { has: () => true },
      send: async () => { dmCalls += 1; }
    });

    const shared = mkMember('dup');
    const guild1 = {
      name: 'G1',
      ownerId: 'dup',
      members: {
        cache: new Map([
          ['dup', shared],
        ]),
        fetch: async () => {}
      }
    };
    const guild2 = {
      name: 'G2',
      ownerId: 'dup',
      members: {
        cache: new Map([
          ['dup', mkMember('dup')], // different instance, same id
        ]),
        fetch: async () => {}
      }
    };

    const interaction = {
      user: { id: '140033402681163776' },
      client: { guilds: { cache: new Map([['1', guild1], ['2', guild2]]) } },
      options: { getString: () => 'hello' },
      async deferReply() {},
      async editReply(content) { this.edited = content; },
    };

    await command.execute(interaction);
    assert.ok(/attempted 1/.test(interaction.edited));
    assert.ok(/sent 1/.test(interaction.edited));
    assert.ok(/failed 0/.test(interaction.edited));
    assert.strictEqual(dmCalls, 1, 'should DM the user only once');
  });
});
