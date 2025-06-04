const assert = require('assert');
const {checkPermissions, transformPermissions} = require('../../src/utils/permission');

describe('permission utils', function () {
  describe('transformPermissions', function () {
    it('transforms snake case to PascalCase keys', function () {
      const input = {BAN_MEMBERS: true, KICK_MEMBERS: false};
      const result = transformPermissions(input);
      assert.deepStrictEqual(result, {BanMembers: true, KickMembers: false});
    });
  });

  describe('checkPermissions', function () {
    it('checks permission via PermissionsBitField', function () {
      const PermissionsBitField = require('discord.js').PermissionsBitField;
      const member = { permissions: { has: (flag) => flag === PermissionsBitField.Flags.BanMembers } };
      assert.strictEqual(checkPermissions(member, 'BAN_MEMBERS'), true);
    });
  });
});
