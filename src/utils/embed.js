const EmbedBuilder = require('discord.js').EmbedBuilder;

class LGDBEmbed {
    constructor() {
        this.embed = new EmbedBuilder();
        return this;
    }

    setTitle(title) {
        this.embed = this.embed.setTitle(title);
        return this;
    }

    setColor(color) {
        this.embed = this.embed.setColor(color);
        return this;
    }

    setImage(url) {
        this.embed = this.embed.setImage(url);
        return this;
    }

    addField(name, value) {
        this.embed = this.embed.addFields({name, value});
        return this;
    }

    build() {
        return this.embed;
    }
}

module.exports = LGDBEmbed;
