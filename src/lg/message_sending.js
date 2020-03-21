const MessageEmbed = require("discord.js").MessageEmbed;
const lg_var = require('./lg_var.js');
const BotData = require("../BotData.js");

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class CommunicationHandler extends IGame {

    constructor(client, message) {

        super(client);

        return this;

    }

    static getLGSampleMsg() {
        return new MessageEmbed()
            .setColor(BotData.BotValues.botColor)
            .setAuthor("Loup-Garou de Thiercelieux", lg_var.roles_img.LoupGarou);
    }

    static reconstructEmbed(messageEmbed) {

        let newEmbed = new MessageEmbed();

        if (messageEmbed.author) newEmbed.setAuthor(messageEmbed.author);
        if (messageEmbed.color) newEmbed.setColor(messageEmbed.color);
        if (messageEmbed.description) newEmbed.setDescription(messageEmbed.description);
        if (messageEmbed.footer) newEmbed.setFooter(messageEmbed.footer);
        if (messageEmbed.image) newEmbed.setImage(messageEmbed.image);
        if (messageEmbed.thumbnail) newEmbed.setThumbnail(messageEmbed.thumbnail);
        if (messageEmbed.title) newEmbed.setTitle(messageEmbed.title);
        if (messageEmbed.url) newEmbed.setURL(messageEmbed.url);

        messageEmbed.fields.forEach(field => {

            if (!(field.name === '\u200B' && field.value === '\u200B')) {
                newEmbed.addField(field.name, field.value, field.inline);
            }

        });

        return newEmbed;
    }

}

module.exports = {

    CommunicationHandler,
    /**
     * Send a message to the current channel and returns a promise
     * @param message
     * @param title
     * @param s
     * @return Promise
     */
    message_curr_chan: (message, title, s) => message.channel.send(new MessageEmbed()
        .addField(title, s)
        .setColor(7419530)
        .setAuthor("Loup-Garou de thiercelieux", lg_var.roles_img.LoupGarou)
    ),

    /**
     * Send a message to the village and returns a promise
     * @param client
     * @param message
     * @param msg
     * @return Promise
     */
    message_to_village: (client, message, msg) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        return (LG.lg_game_channels.village_lg.send(new MessageEmbed()
            .addField('LG - Jeu', msg)
            .setColor(7419530)
            .setAuthor("Loup-Garou de thiercelieux", lg_var.roles_img.LoupGarou)));
    },

    msg: (message, channel, title, msg) => channel.send(new MessageEmbed()
        .addField(title, msg)
        .setColor(7419530)
        .setAuthor("Loup-Garou de thiercelieux", lg_var.roles_img.LoupGarou)
    ),

};
