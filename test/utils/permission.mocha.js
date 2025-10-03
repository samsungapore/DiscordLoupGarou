const assert = require('assert');
const {PermissionsBitField} = require('discord.js');
const {checkPermissions, transformPermissions} = require('../../src/utils/permission');

describe('permission utils', function () {
    it('checkPermissions returns true/false based on flags', function () {
        const granted = new Set([PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageGuild]);
        const permissions = {
            _granted: granted, has: function (flag) {
                return this._granted.has(flag);
            }
        };
        const member = {permissions};

        assert.strictEqual(checkPermissions(member, 'BAN_MEMBERS'), true);
        assert.strictEqual(checkPermissions(member, 'KICK_MEMBERS'), false);
        assert.strictEqual(checkPermissions(member, 'MANAGE_GUILD'), true);
    });

    it('transformPermissions converts to PascalCase keys', function () {
        const input = {BAN_MEMBERS: true, MANAGE_MESSAGES: false};
        const out = transformPermissions(input);
        assert.deepStrictEqual(out, {BanMembers: true, ManageMessages: false});
    });
});
