const BotData = require("../BotData.js");
const lg_var = require("./lg_var");
const RichEmbed = require("discord.js").RichEmbed;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class ChannelsHandler extends IGame {

    constructor(client, guild) {
        super(client);

        this.guild = guild;

        this.everyoneRole = this.guild.roles.find('name', '@everyone');
        this.everyonePermission = {
            loups_garou_de_thiercelieux: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false
            },
            thiercelieux_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false
            },
            village_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false
            },
            paradis_lg: {
                'VIEW_CHANNEL': false,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false
            },
            loups_garou_lg: {
                'VIEW_CHANNEL': false,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': false
            },
        };

        this.category = undefined;

        this.channels = {
            thiercelieux_lg: undefined,
            village_lg: undefined,
            paradis_lg: undefined,
            loups_garou_lg: undefined,
        };

        this._channels = new Map();

        return this;
    }

    async checkChannelsOnGuild() {
        await this.checkCategory();
        await this.checkChannels();
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    checkCategory() {
        return new Promise((resolve, reject) => {

            let channel = this.guild.channels.find("name", "loups_garou_de_thiercelieux");

            if (channel && channel.type === "category") {
                this.category = channel.id;
                this._channels.set(channel.id, channel);
                return resolve(true);
            }

            console.log("0");
            reject(false);
        });
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    checkChannels() {
        return new Promise((resolve, reject) => {
            Object.keys(this.channels).forEach(channelToFind => {

                let channel = this.guild.channels.find('name', channelToFind);

                if (channel && channel.type === "text" &&
                    channel.parentID === this.category) {
                    this.channels[channelToFind] = channel.id;
                    this._channels.set(channel.id, channel);
                }

                if (!this.channels[channelToFind]) {
                    return reject(false);
                }

            });

            resolve(true);

        });
    }

    removeAllOverwrites() {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {

                channel.permissionOverwrites.array().forEach(overwrite => {
                    promises.push(overwrite.delete());
                });

            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    setupChannels(areChannelsReady, configuration) {
        return new Promise((resolve, reject) => {

            if (!areChannelsReady) {
                this.createChannels()
                    .then(() => this.removeAllOverwrites())
                    .then(() => this.setupChannelPermissions(configuration))
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            } else {
                this.removeAllOverwrites()
                    .then(() => this.setupChannelPermissions(configuration))
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            }
        });
    }

    async createChannels() {
        return new Promise((resolve, reject) => {

            let promises = [];
            let promisesCategory = [];

            Object.keys(this.channels).forEach(channelName => {
                if (!this.channels[channelName]) {
                    promises.push(this.guild.createChannel(channelName, "text"));
                }
            });

            if (!this.category) {
                promisesCategory.push(this.guild.createChannel("loups_garou_de_thiercelieux", "category"));
            }

            Promise.all(promisesCategory).then((categoriesCreated) => {

                if (categoriesCreated && categoriesCreated[0]) {
                    this.category = categoriesCreated[0].id;
                    this._channels.set(categoriesCreated[0].id, categoriesCreated[0]);
                    console.log(this.category);
                    console.log(this._channels);
                }

                return Promise.all(promises);
            }).then((channelsCreated) => {

                let otherPromises = [];

                channelsCreated.forEach(createdChannel => {

                    if (createdChannel.type === "category") {
                        this.category = createdChannel.id;
                    } else {
                        otherPromises.push(createdChannel.setParent(this.category));
                        this.channels[createdChannel.name] = createdChannel.id;
                    }
                    this._channels.set(createdChannel.id, createdChannel);

                });

                Promise.all(otherPromises).then(() => resolve(true)).catch(err => reject(err));

            }).catch(err => reject(err));

        });
    }

    deleteChannels() {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {
                promises.push(channel.delete());
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    switchPermissions(channelId, permission, players) {
        return new Promise((resolve, reject) => {

            let promises = [];
            let channel = this._channels.get(channelId);

            for (let player of players.values()) {
                promises.push(channel.overwritePermissions(
                    player.member,
                    permission
                ));
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    setupChannelPermissions(configuration) {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {
                promises.push(this.applyPermissionsOnChannel(channel, configuration.getPlayers()));
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    applyPermissionsOnChannel(channel, players) {
        return new Promise((resolve, reject) => {

            let promises = [];

            if (channel.type !== "category") {

                for (let player of players.values()) {
                    promises.push(channel.overwritePermissions(
                        player.member,
                        player.permission[channel.name]
                    ));
                }

            }

            promises.push(channel.overwritePermissions(
                this.everyoneRole,
                this.everyonePermission[channel.name]
            ));

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    sendMessageToVillage(message) {

        let village = this._channels.get(this.channels.village_lg);

        return village.send(new RichEmbed()
            .addField('LG - Jeu', message)
            .setColor(BotData.bot_values.botColor)
            .setAuthor("Loup-Garou de thiercelieux", lg_var.roles_img.LoupGarou))

    }

    deletePermissionsOverwrites() {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {

                channel.permissionOverwrites.array().forEach(overwrite => {
                    promises.push(overwrite.delete());
                });

            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        })
    }

    deleteMessagesInChannels() {
        return new Promise((resolve, reject) => {

            let promises = [];

            promises.push(this.deleteMessagesInChannel(this._channels.get(this.channels.thiercelieux_lg)));
            promises.push(this.deleteMessagesInChannel(this._channels.get(this.channels.loups_garou_lg)));
            promises.push(this.deleteMessagesInChannel(this._channels.get(this.channels.paradis_lg)));

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    deleteMessagesInChannel(channel) {
        return new Promise((resolve, reject) => {
            channel.fetchMessages({limit: 100}).then((msgFetched) => {

                let promises = [];

                msgFetched.array().forEach(msg => {
                    promises.push(msg.delete());
                });

                Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

            }).catch(err => reject(err));
        })
    }

}

module.exports = {ChannelsHandler};
