const RichEmbed = require('discord.js').RichEmbed;
let botData = require("../BotData.js");

exports.run = (LGBot, message) => {

    message.channel.send(new RichEmbed()
        .setColor(botData.BotValues.botColor)
        .setImage(LGBot.user.avatarURL)
        .setTitle("Guide pour jouer")
        .addField("lg/new", "Lancer une nouvelle partie de Thiercelieux", true)
        .addField("lg/stop", "forcer à stopper une partie (utilisable par les modérateurs)", true)
        .addField("lg/help", "afficher ce message d'aide", true)
    ).catch(console.error);

};

/**
 * module.exports = {
    name: 'help',
    description: 'afficher ce message d\'aide',
    execute(LGBot, message) {
        message.channel.send(new RichEmbed()
            .setColor(botData.BotValues.botColor)
            .setImage(LGBot.user.avatarURL)
            .setTitle("Guide pour jouer")
            .addField("lg/new", "Lancer une nouvelle partie de Thiercelieux", true)
            .addField("lg/stop", "forcer à stopper une partie (utilisable par les modérateurs)", true)
            .addField('lg/addAdmins', 'ajouter des admins au bot LG, capables de stopper des parties de force', true)
            .addField("lg/help", "afficher ce message d'aide", true)
        ).catch(console.error);
    },
};
 */
