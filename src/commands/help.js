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
