const assert = require('assert');
const {PermissionsBitField} = require('discord.js');
const perm = require('../../src/utils/permission');

describe('permission.getBotPermissionStatus', () => {
  it('returns present/missing based on guild.members.me.permissions', () => {
    const granted = new Set([
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.ManageChannels,
    ]);
    const guild = {
      members: {
        me: { permissions: { has: (flag) => granted.has(flag) } }
      }
    };
    const st = perm.getBotPermissionStatus(guild);
    assert.ok(st.present.includes(PermissionsBitField.Flags.ViewChannel));
    assert.ok(st.present.includes(PermissionsBitField.Flags.SendMessages));
    assert.ok(st.present.includes(PermissionsBitField.Flags.AddReactions));
    assert.ok(st.present.includes(PermissionsBitField.Flags.ManageChannels));
    assert.ok(st.missing.includes(PermissionsBitField.Flags.ManageRoles));
  });
});
