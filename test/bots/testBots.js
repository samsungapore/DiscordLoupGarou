const Discord = require('discord.js');

const bots = {
    Amadeus: {
        client: new Discord.Client(),
        data: require('../../src/BotData').TestBots["540521727982305281:Amadeus"]
    },
    Salieri: {
        client: new Discord.Client(),
        data: require('../../src/BotData').TestBots["540521823025233921:Salieri"]
    },
    Fsociety: {
        client: new Discord.Client(),
        data: require('../../src/BotData').TestBots["540521900947013642:Fsociety"]
    },
    Kyouma: {
        client: new Discord.Client(),
        data: require('../../src/BotData').TestBots["540523869283549186:Kyouma"]
    },
};

Object.keys(bots).forEach(botName => {

    bots[botName].client.on('ready', () => {
        console.info(`${botName} connected ${bots[botName].data.inviteLink}`);
    });

    bots[botName].client.on('message', message => {

        if (message.channel.type === 'dm') {
            console.info(`${botName} received : ${message.content}`);
        }

        if (require('../../src/BotData').BotValues.botOwners.includes(message.author.id) && message.content === 'react') {
            let channel = message.channel;
            let promises = [];

            if (message.deletable) {
                promises.push(message.delete());
            }

            Promise.all(promises).then(() => {

                channel.fetchMessages({ limit: 2 }).then((messages) => {
                    const msg = messages.array()[1];

                    msg.react('🐺').then(() => {
                        console.info(`${botName} joined the game`);
                    }).catch(console.error);
                }).catch(console.error);

            }).catch(console.error);

        }

    });

    bots[botName].client.login(bots[botName].data.token).catch(console.error);

});
