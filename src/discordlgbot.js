const {LGDB} = require('./LGDB');
const BotData = require("./BotData");
const {GatewayIntentBits, Partials} = require("discord.js");
const {loadSlashCommands, registerSlashCommands} = require('./slashCommands');

// ClientOptions type
const clientOptions = {
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true
    },
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
}

const LGBot = new LGDB(clientOptions).init();
loadSlashCommands(LGBot);
LGBot.once('ready', async () => {
    try { await registerSlashCommands(LGBot); } catch (e) { console.error('Slash register failed', e); }
});


LGBot.on('clientReady', () => {

    console.info('The bot is ready.');
    console.info(`Connected to ${LGBot.guilds.cache.size} servers, servicing ${LGBot.users.cache.size} unique users.`);
    // Print all server names
    LGBot.guilds.cache.forEach(guild => {
        console.info(`Connected to server: ${guild.id}-${guild.name} with ${guild.memberCount} members.`);
    });

    LGBot.user.setActivity("lg/new - Réalisé par .kazuhiro_");

    console.log(`Le contenu de LG est ${JSON.stringify(LGBot.LG)}`);

});

LGBot.on('error', err => {
    console.error(err);
});

LGBot.on('disconnect', event => {
    console.error(event);
});

LGBot.on('resume', nb => {
    console.info(`Connection resumed. Replayed: ${nb}`);
});

// Generic slash command dispatcher
LGBot.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = LGBot.slashCommands?.get(interaction.commandName);
    if (!cmd) return;
    try { await cmd.execute(interaction); }
    catch (e) {
        console.error('Slash command error', e);
        try {
            const content = 'An error occurred while processing the command.';
            if (interaction.deferred || interaction.replied) await interaction.editReply(content);
            else await interaction.reply({content, ephemeral: true});
        } catch (_) {}
    }
});

LGBot.on('messageCreate', message => {

    if (message.author.bot) return;

    const args = message.content.slice(BotData.BotValues.botPrefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (!message.content.startsWith(BotData.BotValues.botPrefix)) {
        return;
    }

    if (!LGBot.commands.has(command)) return;

    // Short deprecation notice pointing to slash commands
    try {
        const slashMap = { addadmins: 'add-admins', setloglevel: 'set-log-level' };
        const slashName = slashMap[command] || command;
        message.reply(`Commande dépréciée: utilisez plutôt /${slashName}`).catch(console.error);
    } catch (_) {}

    try {
        LGBot.commands.get(command).execute(LGBot, message, args);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!').catch(console.error);
    }

});

LGBot.login(BotData.BotValues.botToken).then(() => {
    console.log('Logged in');
}).catch(console.error);
