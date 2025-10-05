const {ApplicationCommandOptionType} = require('discord.js');
const winston = require('../utils/logger');
const BotData = require('../BotData');

module.exports = {
    name: 'set-log-level',
    description: 'Changer le niveau de log du bot (owner-only)',
    options: [
        {
            name: 'level',
            description: 'Niveau: error|warn|info|http|verbose|debug|silly',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {name: 'error', value: 'error'},
                {name: 'warn', value: 'warn'},
                {name: 'info', value: 'info'},
                {name: 'http', value: 'http'},
                {name: 'verbose', value: 'verbose'},
                {name: 'debug', value: 'debug'},
                {name: 'silly', value: 'silly'},
            ]
        }
    ],
    dm_permission: false,
    category: 'admin',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        if (!BotData.BotValues.botOwners.includes(interaction.user.id)) {
            return interaction.reply({content: "Vous n'avez pas la permission de changer le niveau de log", ephemeral: true});
        }
        const level = interaction.options.getString('level', true);
        winston.level = level;
        return interaction.reply({content: `Niveau de log changé à ${level}`, ephemeral: true});
    }
};
