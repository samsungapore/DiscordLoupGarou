const {PermissionsBitField, ApplicationCommandOptionType} = require('discord.js');

// Default per-DM delay to be gentle with rate limits; configurable for tests
let BROADCAST_DELAY_MS = Number(process.env.BROADCAST_DELAY_MS || 150);
let BROADCAST_ASYNC = String(process.env.BROADCAST_ASYNC || '0') !== '0';
let PROGRESS_UPDATE_MS = Number(process.env.BROADCAST_PROGRESS_MS || 5000);

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

async function dmMembersSequential(iterable, text, sleep = (() => Promise.resolve()), onProgress) {
    let attempted = 0, sent = 0, failed = 0;
    for (const m of iterable) {
        attempted++;
        try {
            await m.send(text);
            sent++;
        } catch (_) {
            failed++;
        }
        await sleep();
        if (onProgress) onProgress({attempted, sent, failed});
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

        const sleepFn = () => BROADCAST_DELAY_MS > 0 ? new Promise(r => setTimeout(r, BROADCAST_DELAY_MS)) : Promise.resolve();
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

        const recipients = Array.from(uniqueRecipients.values());

        if (BROADCAST_ASYNC) {
            await interaction.editReply(`Broadcast started: ${recipients.length} recipients. Delay ${BROADCAST_DELAY_MS}ms.`);
            const startedAt = Date.now();
            let lastEdit = 0;
            const onProgress = async ({attempted, sent, failed}) => {
                const now = Date.now();
                if (now - lastEdit >= PROGRESS_UPDATE_MS) {
                    lastEdit = now;
                    try {
                        await interaction.editReply(`Broadcast in progress: attempted ${attempted}, sent ${sent}, failed ${failed}.`);
                    } catch (_) {
                    }
                }
            };
            // fire-and-forget processing
            dmMembersSequential(recipients, `Admin notice:\n\n${text}`, sleepFn, onProgress)
                .then(async ({attempted, sent, failed}) => {
                    try {
                        await interaction.editReply(`Broadcast complete: attempted ${attempted}, sent ${sent}, failed ${failed}. (took ${Math.round((Date.now() - startedAt) / 1000)}s)`);
                    } catch (_) {
                        // fallback: try DM initiator if editing failed (window expired)
                        try {
                            await interaction.user.send(`Broadcast complete: attempted ${attempted}, sent ${sent}, failed ${failed}.`);
                        } catch (_) {
                        }
                    }
                })
                .catch(async () => {
                    try {
                        await interaction.editReply('Broadcast encountered an error.');
                    } catch (_) {
                    }
                });
            return; // do not await
        }

        const {attempted, sent, failed} = await dmMembersSequential(recipients, `Admin notice:\n\n${text}`, sleepFn);
        await interaction.editReply(`Broadcast complete: attempted ${attempted}, sent ${sent}, failed ${failed}.`);
    },
    _internal: {
        getGuildAdmins,
        dmMembersSequential,
        setBroadcastDelayMs: (ms) => {
            BROADCAST_DELAY_MS = Number(ms);
        },
        setAsyncMode: (on) => {
            BROADCAST_ASYNC = !!on;
        },
        setProgressMs: (ms) => {
            PROGRESS_UPDATE_MS = Number(ms);
        }
    }
};
