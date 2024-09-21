const {LGDB} = require('./LGDB');
const {GatewayIntentBits} = require('discord-api-types/v10');

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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
}

const LGBot = new LGDB(clientOptions).init();

const BotData = require("./BotData");

LGBot.on('ready', () => {

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

LGBot.on('messageCreate', message => {

    if (message.author.bot) return;

    const args = message.content.slice(BotData.BotValues.botPrefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (!message.content.startsWith(BotData.BotValues.botPrefix)) {
        return;
    }

    if (!LGBot.commands.has(command)) return;

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
