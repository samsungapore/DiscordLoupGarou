const {ApplicationCommandOptionType} = require('discord.js');
const {ROLE_COMPOSITION_USAGE} = require('../utils/roleCompositionParser');

module.exports = {
    name: 'new',
    description: 'Lancer une nouvelle partie de Thiercelieux',
    options: [
        {
            name: 'bots',
            description: 'Nombre de bots IA',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            min_value: 0,
            max_value: 20,
        },
        {
            name: 'seed',
            description: "Graine aléatoire de l'IA",
            type: ApplicationCommandOptionType.Integer,
            required: false,
        },
        {
            name: 'fast',
            description: "Accélérer l'IA",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: 'roles',
            description: `Composition personnalisée. ${ROLE_COMPOSITION_USAGE}`,
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    dm_permission: false,
    category: 'game',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const legacy = require('../commands/new.js');

        const bots = interaction.options.getInteger('bots');
        const seed = interaction.options.getInteger('seed');
        const fast = interaction.options.getBoolean('fast');
        const roles = interaction.options.getString('roles');

        const args = [];
        if (Number.isInteger(bots)) args.push(`--bots=${bots}`);
        if (Number.isInteger(seed)) args.push(`--seed=${seed}`);
        if (fast) args.push('--fast');
        if (roles) args.push(`--roles=${roles}`);

        try {
            await interaction.reply({content: 'Démarrage de la partie…', ephemeral: true});
        } catch (_) {
            // already acknowledged
        }

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

        await legacy.execute(interaction.client, messageLike, args);
    }
};
