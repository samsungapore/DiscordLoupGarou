const MessageEmbed = require('discord.js').MessageEmbed;
let botData = require("../BotData.js");
const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'afficher ce message d\'aide',
    execute(LGBot, message) {

        let helpMsg = new MessageEmbed()
            .setColor(botData.BotValues.botColor)
            .setImage(LGBot.user.avatarURL())
            .setTitle("Guide pour jouer");

        let i = 1;

        for (const file of fs.readdirSync('./src/commands')) {

            const command = require(`./${file}`);

            if (i === 25) {
                message.channel.send(helpMsg).catch(console.error);
                i = 0;
                helpMsg = new MessageEmbed()
                    .setColor(botData.BotValues.botColor)
                    .setImage(LGBot.user.avatarURL())
                    .setTitle("Guide pour jouer");
            }

            helpMsg.addField(command.name, command.description);

            i++;
        }

        message.channel.send(helpMsg).catch(console.error);
    },
};
