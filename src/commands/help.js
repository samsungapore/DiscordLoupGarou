let botData = require("../BotData.js");
const fs = require('fs');
const LGDBEmbed = require("../utils/embed");

module.exports = {
    name: 'help',
    description: 'afficher ce message d\'aide',
    execute(LGBot, message) {

        let helpMsg = new LGDBEmbed()
            .setColor(botData.BotValues.botColor)
            .setImage(LGBot.user.avatarURL())
            .setTitle("Guide pour jouer");

        let i = 1;

        for (const file of fs.readdirSync('./src/commands')) {

            const command = require(`./${file}`);

            if (i === 25) {
                message.channel.send({
                    embeds: [
                        helpMsg.build()
                    ]
                }).catch(console.error);
                i = 0;
                helpMsg = new LGDBEmbed()
                    .setColor(botData.BotValues.botColor)
                    .setImage(LGBot.user.avatarURL())
                    .setTitle("Guide pour jouer");
            }

            helpMsg.addField(command.name, command.description === '' ? 'Pas de description' : command.description);

            i++;
        }

        message.channel.send({
            embeds: [
                helpMsg.build()
            ]
        }).catch(console.error);
    },
};
