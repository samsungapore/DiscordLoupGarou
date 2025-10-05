const {ApplicationCommandOptionType} = require('discord.js');
const BotData = require('../BotData');

module.exports = {
    name: 'reload',
    description: 'Réservé au développeur du bot',
    options: [
        {
            name: 'command',
            description: 'Nom de la commande à recharger',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    dm_permission: false,
    category: 'admin',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        if (!BotData.BotValues.botOwners.includes(interaction.user.id)) {
            return interaction.reply({content: "Réservé au développeur du bot", ephemeral: true});
        }
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands?.get(commandName)
            || Array.from(interaction.client.commands?.values() || []).find(cmd => (cmd.aliases || []).includes(commandName));

        if (!command) {
            return interaction.reply({content: `There is no command with name or alias \`${commandName}\`.`, ephemeral: true});
        }

        return interaction.reply({content: `Reload not implemented for legacy commands.`, ephemeral: true});
    }
};
