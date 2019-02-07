const Discord = require('discord.js');
const LGBot = new Discord.Client();

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


LGBot.on('ready', () => {

    console.info('The bot is ready.');
    console.info(`Connected to ${LGBot.guilds.size} servers, servicing ${LGBot.users.size} users.`);

    LGBot.user.setActivity("Alpha 2.1").catch(console.error);

    if (LGBot.Settings.Admins) {
        LGBot.Settings.Admins.forEach(adminID => {
            let user = LGBot.users.get(adminID);

            if (user) user.send('Le bot Loup Garou a redémarré').catch(console.error);
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

    const args = message.content.slice(3).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (!message.content.startsWith(BotData.BotValues.botPrefix)) {
        return;
    }

    try {
        let commandFile = require(`./commands/${command}.js`);

        commandFile.run(LGBot, message, args);

    } catch (e) {
        console.error(e);
    }

});

LGBot.login(BotData.BotValues.botToken).then(() => {
    console.log('Logged in');
}).catch(console.error);
