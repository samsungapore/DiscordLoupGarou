const list = (v) => String(v || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

module.exports = {
    isUserPremium(id) {
        if (!id) return false;
        return list(process.env.LG_PREMIUM_USER_IDS).includes(String(id));
    },
    isGuildPremium(id) {
        if (!id) return false;
        return list(process.env.LG_PREMIUM_GUILD_IDS).includes(String(id));
    },
    hasPremium({userId, guildId} = {}) {
        return this.isUserPremium(userId) || this.isGuildPremium(guildId);
    }
};
