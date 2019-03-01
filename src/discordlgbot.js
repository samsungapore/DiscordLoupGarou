const Discord = require('discord.js');
const LGBot = new Discord.Client();

const BGM = new Discord.Client();

// UTC + x
const UTC_LOCAL_TIMESIFT = 1;

const Enmap = require('enmap');
const EnmapLevel = require('enmap-level');

const fs = require('graceful-fs');
const BotData = require("./BotData");

const Settings = new EnmapLevel({name: "Settings"});
LGBot.Settings = new Enmap({provider: Settings});

const LG = new EnmapLevel({name: "LG"});
LGBot.LG = new Enmap({provider: LG});

LGBot.commands = new Discord.Collection();

for (const file of fs.readdirSync('./src/commands')) {
    const command = require(`./commands/${file}`);

    LGBot.commands.set(command.name, command);
}

LGBot.on('ready', () => {

    console.info('The bot is ready.');
    console.info(`Connected to ${LGBot.guilds.size} servers, servicing ${LGBot.users.size} users.`);

    LGBot.user.setActivity("lg/new - Réalisé par Kazuhiro#1248").catch(console.error);

    LGBot.voiceConnections.array().forEach(voiceConnection => {
        voiceConnection.disconnect();
    });

    if (LGBot.Settings.Admins) {
        LGBot.Settings.Admins.forEach(adminID => {
            let user = LGBot.users.get(adminID);

            if (user) user.send('Le bot Loup Garou a redémarré').catch(console.error);
        });
    } else {
        LGBot.Settings.Admins = [];

        LGBot.guilds.array().forEach(guild => {
            LGBot.Settings.Admins.push(guild.ownerID);

            let user = LGBot.users.get(guild.ownerID);

            if (user) user.send('Le bot Loup Garou vient de redémarrer').catch(console.error);

        });
    }

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
        message.reply('there was an error trying to execute that command!');
    }

});

LGBot.login(BotData.BotValues.botToken).then(() => {
    console.log('Logged in');
}).catch(console.error);
