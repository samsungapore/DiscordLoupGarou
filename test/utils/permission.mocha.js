const assert = require('assert');
const {PermissionsBitField} = require('discord.js');

function loadPermissionModule() {
    delete require.cache[require.resolve('../../src/utils/permission')];
    delete require.cache[require.resolve('../../src/BotData')];
    return require('../../src/utils/permission');
}

describe('permission utils', function () {
    beforeEach(function () {
        process.env.LG_BOT_ID = '987654';
    });

    afterEach(function () {
        delete require.cache[require.resolve('../../src/utils/permission')];
        delete process.env.LG_BOT_ID;
    });

    it('checkPermissions returns true/false based on flags', function () {
        const {checkPermissions} = loadPermissionModule();
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
        const {transformPermissions} = loadPermissionModule();
        const input = {BAN_MEMBERS: true, MANAGE_MESSAGES: false};
        const out = transformPermissions(input);
        assert.deepStrictEqual(out, {BanMembers: true, ManageMessages: false});
    });

    it('buildInviteLink composes URL with bot id and permissions', function () {
        const perm = loadPermissionModule();
        const bitfield = perm.bitfieldOf([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
        ]);
        const invite = perm.buildInviteLink(bitfield);
        assert.ok(invite.includes('client_id=987654'));
        assert.ok(invite.includes(`permissions=${bitfield}`));
    });

    it('bitfieldOf aggregates flags into a stringified bigint', function () {
        const perm = loadPermissionModule();
        const value = perm.bitfieldOf([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ManageChannels,
        ]);
        const expected = (BigInt(PermissionsBitField.Flags.ViewChannel) | BigInt(PermissionsBitField.Flags.ManageChannels)).toString();
        assert.strictEqual(value, expected);
    });

    it('inferRequiredFromError inspects API path to guess missing permissions', function () {
        const perm = loadPermissionModule();
        const err = {path: '/channels/123/messages'};
        const missing = perm.inferRequiredFromError(err);
        assert.deepStrictEqual(missing, [PermissionsBitField.Flags.ManageChannels]);
        assert.deepStrictEqual(perm.inferRequiredFromError({path: '/roles/1'}), [PermissionsBitField.Flags.ManageRoles]);
        assert.deepStrictEqual(perm.inferRequiredFromError({path: '/channels'}), [PermissionsBitField.Flags.ManageChannels]);
        assert.deepStrictEqual(perm.inferRequiredFromError({path: '/other'}), []);
    });
});
