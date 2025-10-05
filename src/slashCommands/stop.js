module.exports = {
    name: 'stop',
    description: 'Forcer la fin de partie',
    options: [],
    dm_permission: false,
    category: 'game',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const legacy = require('../commands/stop.js');
        try {
            await interaction.reply({content: 'Arrêt de la partie…', ephemeral: true});
        } catch (_) {}
        const messageLike = {
            member: interaction.member,
            guild: interaction.guild,
            author: interaction.user,
            channel: interaction.channel,
            reply: (content) => {
                if (!interaction.deferred && !interaction.replied) return interaction.reply({content, ephemeral: true});
                return interaction.followUp({content, ephemeral: true});
            },
        };
        await legacy.execute(interaction.client, messageLike, []);
    }
};
