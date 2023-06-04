const Discord = require('discord.js');
const LGBot = new Discord.Client();

// UTC + x
const UTC_LOCAL_TIMESIFT = 1;

const fs = require('graceful-fs');
const BotData = require("./BotData");

LGBot.Settings = new Map();

LGBot.LG = new Map();

LGBot.commands = new Discord.Collection();

for (const file of fs.readdirSync('./src/commands')) {
    const command = require(`./commands/${file}`);

    LGBot.commands.set(command.name, command);
}

LGBot.on('ready', () => {

    console.info('The bot is ready.');
    console.info(`Connected to ${LGBot.guilds.cache.size} servers, servicing ${LGBot.users.cache.size} users.`);

    LGBot.user.setActivity("lg/new").catch(console.error);

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

LGBot.on('message', message => {

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
