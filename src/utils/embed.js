const {EmbedBuilder} = require('discord.js');
const COLORS = require('./colors');

class MessageEmbed {
    constructor() {
        this.embed = new EmbedBuilder();
    }

    setTitle(title) {
        this.embed.setTitle(title);
        return this;
    }

    setColor(color) {
        this.embed.setColor(COLORS[color] || color);
        return this;
    }

    setImage(url) {
        this.embed.setImage(url);
        return this;
    }

    setDescription(description) {
        this.embed.setDescription(description);
        return this;
    }

    setAuthor(name, iconURL, url) {
        this.embed.setAuthor({name, iconURL, url});
        return this;
    }

    setURL(url) {
        this.embed.setURL(url);
        return this;
    }

    addField(name, value) {
        const fieldNumberId = this.embed.data.fields?.length + 1 || 0;
        this.embed.addFields({name: name || `#${fieldNumberId}`, value: value || 'Empty field.'});
        return this;
    }

    addFields(fields) {
        this.embed.addFields(fields);
        return this;
    }

    setFieldValue(fieldIndex, value) {
        this.embed.data.fields[fieldIndex].value = value;
        return this;
    }

    getFieldValue(fieldIndex) {
        return this.embed.data.fields[fieldIndex].value;
    }

    setThumbnail(thumbnail) {
        this.embed.setThumbnail(thumbnail);
        return this;
    }

    setFooter(footer) {
        this.embed.setFooter({text: footer});
        return this;
    }

    build() {
        return this.embed;
    }

    updateParticipationField(participantsDisplayText) {
        this.embed.data.fields[this.embed.data.fields.length - 1].value = participantsDisplayText;
    }
}

module.exports = MessageEmbed;
