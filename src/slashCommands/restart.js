const {ApplicationCommandOptionType} = require('discord.js');
const BotData = require('../BotData');

module.exports = {
    name: 'restart',
    description: 'Redémarrer le bot (owner-only)',
    options: [
        {
            name: 'message',
            description: 'Message de redémarrage (optionnel)',
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
    dm_permission: false,
    category: 'admin',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const legacy = require('../commands/restart.js');
        if (!BotData.BotValues.botOwners.includes(interaction.user.id)) {
            return interaction.reply({content: "Vous n'avez pas la permission", ephemeral: true});
        }
        const msg = interaction.options.getString('message') || '';
        try { await interaction.reply({content: 'Redémarrage programmé…', ephemeral: true}); } catch (_) {}
        const messageLike = {
            guild: interaction.guild,
            author: interaction.user,
            channel: interaction.channel,
            reply: (content) => {
                if (!interaction.deferred && !interaction.replied) return interaction.reply({content, ephemeral: true});
                return interaction.followUp({content, ephemeral: true});
            },
        };
        await legacy.execute(interaction.client, messageLike, msg ? [msg] : []);
    }
};
