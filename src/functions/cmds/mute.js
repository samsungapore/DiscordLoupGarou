const BotData = require("../../BotData.js");
const RichEmbed = require("discord.js").RichEmbed;

class Mute {

    constructor(client, message, target, duration) {

        this.message = message;
        this.target = target;
        this.duration = duration;
        this.client = client;

        this.userData = client.moderationData.get(target.id);

        if (!this.userData) {
            this.userData = BotData.moderationData;
            client.moderationData.set(target.id, this.userData);
        }

        return this;
    }

    mute() {
        return new Promise((resolve, reject) => {

            let promises = [];

            this.message.guild.channels.array().forEach(channel => {

                if (channel.type === "text") {
                    promises.push(
                        channel.overwritePermissions(
                            this.target,
                            {
                                'SEND_MESSAGES': false,
                                'ADD_REACTIONS': false
                            }
                        )
                    );
                }

            });

            Promise.all(promises).then(() => {
                this.message.channel.send(new RichEmbed()
                    .setColor(this.target.displayColor)
                    .setAuthor(this.target.displayName, this.target.user.avatarURL)
                    .setDescription("Réduit au silence pour " + this.duration / 1000 / 60 / 60  + " heure(s)")
                ).then(() => {

                    this.userData = this.client.moderationData.get(this.target.id);
                    this.userData.mutes.push(new Date());
                    this.client.moderationData.set(this.target.id, this.userData);

                    this.timeout = setTimeout(() => {
                        this.unmute().then(() => resolve(true)).catch(err => reject(err));
                    }, this.duration);

                }).catch(err => reject(err));
            }).catch(err => reject(err));

        });
    }

    unmute() {
        return new Promise((resolve, reject) => {

            let promises = [];

            this.message.guild.channels.array().forEach(channel => {

                if (channel.type === "text") {
                    channel.permissionOverwrites.array().forEach(p => {
                        if (p.id === this.target.id) {
                            promises.push(p.delete());
                        }
                    });
                }

            });

            if (promises.length > 0) {

                Promise.all(promises).then(() => {
                    this.message.channel.send(new RichEmbed()
                        .setColor(this.target.displayColor)
                        .setAuthor(this.target.displayName, this.target.user.avatarURL)
                        .setDescription("Peut de nouveau parler.")
                    ).catch(console.error);
                    resolve(true);
                }).catch(err => reject(err));

            } else {
                resolve(true);
            }

        });
    }

}

module.exports = {Mute};
