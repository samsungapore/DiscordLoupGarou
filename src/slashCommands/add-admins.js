const {ApplicationCommandOptionType, PermissionsBitField} = require('discord.js');
const BotData = require('../BotData');

module.exports = {
    name: 'add-admins',
    description: 'Ajouter un admin LG (peut stopper des parties de force)',
    options: [
        {
            name: 'user',
            description: 'Utilisateur à ajouter',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    dm_permission: false,
    category: 'admin',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const member = interaction.member;
        if (!member?.permissions?.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({content: "Tu n'as pas la permission", ephemeral: true});
        }

        const targetUser = interaction.options.getUser('user', true);
        let Settings = interaction.client.Settings.get(interaction.guild.id);
        if (!Settings) {
            interaction.client.Settings.set(interaction.guild.id, BotData.Settings);
            Settings = interaction.client.Settings.get(interaction.guild.id);
        }

        Settings.Admins.push(targetUser.id);
        Settings.Admins = [...new Set(Settings.Admins)];
        interaction.client.Settings.set(interaction.guild.id, Settings);

        return interaction.reply({content: `Ajouté aux admins: <@${targetUser.id}>`, ephemeral: true});
    }
};
