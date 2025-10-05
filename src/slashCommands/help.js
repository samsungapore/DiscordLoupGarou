const {ApplicationCommandOptionType} = require('discord.js');
const MessageEmbed = require('../utils/embed');

function usageFor(cmd) {
    const parts = [`/${cmd.name}`];
    for (const opt of cmd.options || []) {
        const optName = opt.name;
        const required = !!opt.required;
        parts.push(required ? `<${optName}>` : `[${optName}]`);
    }
    return parts.join(' ');
}

module.exports = {
    name: 'help',
    description: "Afficher l'aide des commandes",
    options: [
        {
            name: 'commande',
            description: 'Afficher le détail pour une commande',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'categorie',
            description: 'Filtrer par catégorie',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {name: 'game', value: 'game'},
                {name: 'admin', value: 'admin'},
                {name: 'autre', value: 'other'},
            ]
        }
    ],
    dm_permission: true,
    category: 'meta',
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const commands = interaction.client.slashCommands || new Map();
        const query = (interaction.options.getString('commande') || '').toLowerCase();
        const category = interaction.options.getString('categorie') || null;

        const list = Array.from(commands.values())
            .filter(c => !category || (c.category || 'other') === category);

        if (query) {
            const cmd = list.find(c => c.name.toLowerCase() === query);
            if (!cmd) return interaction.reply({content: `Commande inconnue: ${query}`, ephemeral: true});

            const embed = new MessageEmbed()
                .setTitle(`Aide: /${cmd.name}`)
                .setColor([0, 210, 255])
                .setDescription(cmd.description || '');

            embed.addField('Usage', usageFor(cmd));
            if (cmd.options?.length) {
                for (const opt of cmd.options) {
                    const req = opt.required ? '(requis)' : '(optionnel)';
                    embed.addField(opt.name, `${opt.description || ''} ${req}`.trim());
                }
            }
            return interaction.reply({embeds: [embed.build()]});
        }

        // Group by category
        const byCat = new Map();
        for (const c of list) {
            const cat = c.category || 'other';
            if (!byCat.has(cat)) byCat.set(cat, []);
            byCat.get(cat).push(c);
        }

        const embed = new MessageEmbed()
            .setTitle('Commandes disponibles')
            .setColor([0, 210, 255]);

        for (const [cat, cmds] of byCat.entries()) {
            embed.addField(`Categorie: ${cat}`, cmds.map(c => `• ${usageFor(c)} — ${c.description}`).join('\n'));
        }

        return interaction.reply({embeds: [embed.build()]});
    }
};
