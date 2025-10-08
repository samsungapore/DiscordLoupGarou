const { PermissionsBitField } = require('discord.js');
const BotData = require('../BotData');

/**
 * Cette fonction permet de vérifier les permissions d'un guild member
 */
function checkPermissions(member, permission) {
    const permissionMap = {
        "BAN_MEMBERS": PermissionsBitField.Flags.BanMembers,
        "KICK_MEMBERS": PermissionsBitField.Flags.KickMembers,
        "MANAGE_GUILD": PermissionsBitField.Flags.ManageGuild,
        "MANAGE_CHANNELS": PermissionsBitField.Flags.ManageChannels,
        "MANAGE_MESSAGES": PermissionsBitField.Flags.ManageMessages,
        "MANAGE_ROLES": PermissionsBitField.Flags.ManageRoles,
        "MANAGE_WEBHOOKS": PermissionsBitField.Flags.ManageWebhooks,
        "VIEW_AUDIT_LOG": PermissionsBitField.Flags.ViewAuditLog,
        "VIEW_GUILD_INSIGHTS": PermissionsBitField.Flags.ViewGuildInsights,
    };
    return member.permissions.has(permissionMap[permission]);
}

function transformPermissions(oldPermissions) {
    const newPermissions = {};
    for (const [key, value] of Object.entries(oldPermissions)) {
        // Convertir la clé en PascalCase
        const words = key.toLowerCase().split('_');
        const pascalCaseKey = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
        newPermissions[pascalCaseKey] = value;
    }
    return newPermissions;
}

module.exports = {
    checkPermissions,
    transformPermissions,
    /**
     * Minimal set of permissions recommended for full gameplay.
     */
    REQUIRED_PERMISSIONS: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.ManageRoles,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.MoveMembers,
    ],
    /**
     * Returns present/missing permissions for the bot in the given guild.
     * @param {import('discord.js').Guild} guild
     */
    getBotPermissionStatus(guild) {
        const me = guild?.members?.me || null;
        const status = { present: [], missing: [], unknown: !me };
        const required = this.REQUIRED_PERMISSIONS;
        const has = (flag) => me?.permissions?.has(flag) || false;
        for (const flag of required) {
            (has(flag) ? status.present : status.missing).push(flag);
        }
        return status;
    },
    /**
     * Builds an invite link for the bot with the provided bitfield sum.
     */
    buildInviteLink(permissionsBitfield) {
        const clientId = BotData.BotValues.botId;
        if (!clientId) return '';
        const base = 'https://discord.com/api/oauth2/authorize';
        const scopes = 'bot%20applications.commands';
        return `${base}?client_id=${clientId}&scope=${scopes}&permissions=${permissionsBitfield}`;
    },
    /**
     * Compute integer bitfield from array of Permission flags.
     */
    bitfieldOf(flags) {
        return flags.reduce((acc, f) => acc | BigInt(f), 0n).toString();
    },
    /**
     * Best-effort inference of required permissions from a DiscordAPIError.
     */
    inferRequiredFromError(err) {
        const path = String(err?.path || '');
        if (path.includes('/roles')) return [PermissionsBitField.Flags.ManageRoles];
        if (path.includes('/channels')) return [PermissionsBitField.Flags.ManageChannels];
        if (path.includes('/messages')) return [PermissionsBitField.Flags.ManageMessages];
        return [];
    },
}