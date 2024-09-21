

const { PermissionsBitField } = require('discord.js');

/**
 * Cette fonction permet de vérifier les permissions d'un guild member
 */
function checkPermissions(member, permission) {
    switch (permission) {
        case "BAN_MEMBERS":
            return member.permissions.has(PermissionsBitField.Flags.BanMembers);
        case "KICK_MEMBERS":
            return member.permissions.has(PermissionsBitField.Flags.KickMembers);
        case "MANAGE_GUILD":
            return member.permissions.has(PermissionsBitField.Flags.ManageGuild);
        case "MANAGE_CHANNELS":
            return member.permissions.has(PermissionsBitField.Flags.ManageChannels);
        case "MANAGE_MESSAGES":
            return member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        case "MANAGE_ROLES":
            return member.permissions.has(PermissionsBitField.Flags.ManageRoles);
        case "MANAGE_WEBHOOKS":
            return member.permissions.has(PermissionsBitField.Flags.ManageWebhooks);
        case "VIEW_AUDIT_LOG":
            return member.permissions.has(PermissionsBitField.Flags.ViewAuditLog);
        case "VIEW_GUILD_INSIGHTS":
            return member.permissions.has(PermissionsBitField.Flags.ViewGuildInsights);
    }
}

module.exports = {
    checkPermissions
}