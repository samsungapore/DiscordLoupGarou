const BotData = require('../BotData');

module.exports = {
  name: 'invite',
  description: "Obtenir le lien d'invitation du bot",
  options: [],
  dm_permission: true,
  category: 'meta',
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    let link = (BotData.BotValues.botInviteLink || '').trim();
    if (!link) {
      const clientId = BotData.BotValues.botId || interaction.client?.user?.id || '';
      const base = 'https://discord.com/api/oauth2/authorize';
      const scopes = 'bot%20applications.commands';
      const permissions = 468839664; // historical permissions used by the project
      link = clientId
        ? `${base}?client_id=${clientId}&scope=${scopes}&permissions=${permissions}`
        : 'Invite link is not configured. Contact the bot owner.';
    }
    return interaction.reply({ content: link, ephemeral: true });
  }
};
