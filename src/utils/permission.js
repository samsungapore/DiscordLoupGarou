const { PermissionsBitField } = require('discord.js');

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
    transformPermissions
}