const {PermissionsBitField, ApplicationCommandOptionType} = require('discord.js');

function getGuildAdmins(guild) {
    const admins = new Map();
    if (guild.ownerId) {
        const owner = guild.members.cache.get(guild.ownerId) || null;
        if (owner && !owner.user.bot) admins.set(owner.id, owner);
    }
    for (const member of guild.members.cache.values()) {
        if (member.user?.bot) continue;
        try {
            if (member.permissions?.has(PermissionsBitField.Flags.Administrator)) {
                admins.set(member.id, member);
            }
        } catch (_) {
            // ignore permission access errors
        }
    }
    return admins;
}

async function dmMembersSequential(iterable, text, sleep = (() => Promise.resolve())) {
    let attempted = 0, sent = 0, failed = 0;
    for (const m of iterable) {
        attempted++;
        try {
            await m.send(text);
            sent++;
        } catch (_) {
            failed++;
        }
        await sleep(0);
    }
    return {attempted, sent, failed};
}

module.exports = {
    name: 'admin-broadcast',
    description: 'Owner: DM admins of all servers',
    options: [
        {
            name: 'message',
            description: 'Message to send',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    dm_permission: false,
    /**
     * Executes the admin-broadcast command
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        if (interaction.user.id !== '140033402681163776') {
            return interaction.reply({content: 'You are not allowed to use this command.', ephemeral: true});
        }

        const text = interaction.options.getString('message', true).slice(0, 2000);
        await interaction.deferReply({ephemeral: true});

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        // Collect unique recipients across all guilds (dedupe by user ID)
        const uniqueRecipients = new Map();
        for (const guild of interaction.client.guilds.cache.values()) {
            try {
                await guild.members.fetch();
                const admins = getGuildAdmins(guild);
                for (const [id, member] of admins) {
                    if (!uniqueRecipients.has(id)) uniqueRecipients.set(id, member);
                }
            } catch (_) {
                // Skip guild on error
            }
        }

        const {attempted, sent, failed} = await dmMembersSequential(
            Array.from(uniqueRecipients.values()),
            `Admin notice:\n\n${text}`,
            (delay) => sleep(delay || 150)
        );

        await interaction.editReply(`Broadcast complete: attempted ${attempted}, sent ${sent}, failed ${failed}.`);
    },
    _internal: { getGuildAdmins, dmMembersSequential }
};
