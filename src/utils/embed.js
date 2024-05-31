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
}

module.exports = LGDBEmbed;
