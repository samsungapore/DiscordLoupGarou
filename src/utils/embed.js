const EmbedBuilder = require('discord.js').EmbedBuilder;

class MessageEmbed {
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

    setDescription(description) {
        this.embed = this.embed.setDescription(description);
        return this;
    }

    setAuthor(name, iconURL, url) {
        const options = {
            name: name,
            icon_url: iconURL,
            url: url
        };
        this.embed = this.embed.setAuthor(options);
        return this;
    }

    setURL(url) {
        this.embed = this.embed.setURL(url);
        return this;
    }

    addField(name, value) {
        const fieldNumberId = this.embed.data.fields?.length + 1 || 0;
        if (!name) {
            name = `#${fieldNumberId}`;
        }
        if (!value) {
            value = 'Empty field.';
        }
        this.embed = this.embed.addFields({name, value});
        return this;
    }

    build() {
        return this.embed;
    }

    setThumbnail(thumbnail) {
        this.embed = this.embed.setThumbnail(thumbnail);
        return this;
    }

    setFooter(footer) {
        this.embed = this.embed.setFooter(footer);
        return this;
    }
}

module.exports = MessageEmbed;
