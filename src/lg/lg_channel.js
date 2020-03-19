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

    constructor(client, guild, gameInfo) {
        super(client);

        this.gameInfo = gameInfo;

        this.guild = guild;

        this.everyoneRole = this.guild.roles.find(x => x.name === '@everyone');
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

        this.mastermindPermissions = {};

        [
            "loups_garou_de_thiercelieux",
            "thiercelieux_lg",
            "village_lg",
            "paradis_lg",
            "loups_garou_lg",
            "petite_fille_lg"
        ].forEach(element => {
            this.mastermindPermissions[element] = {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
                'ADD_REACTIONS': true,
                'MANAGE_CHANNELS': true,
                'MANAGE_MESSAGES': true,
                'MANAGE_ROLES': true,
            };
        });

        this.category = undefined;

        this.channels = {
            thiercelieux_lg: undefined,
            village_lg: undefined,
            paradis_lg: undefined,
            loups_garou_lg: undefined,
        };

        this.voiceChannels = {
            vocal_lg: undefined,
            mort_lg: undefined,
        };

        this._channels = new Map();

        return this;
    }

    async moveVocalPlayers(configuration) {
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

            let channel = this.guild.channels.find(x => x.name === "loups_garou_de_thiercelieux");

            if (channel && channel.type === "category") {
                this.category = channel.id;
                this._channels.set(channel.id, channel);
                return resolve(true);
            }

            reject(false);
        });
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    checkChannels() {
        return new Promise((resolve, reject) => {

            let allPresent = true;

            // check text channels
            Object.keys(this.channels).forEach(channelToFind => {

                let channel = this.guild.channels.find(x => x.name === channelToFind);

                if (channel && channel.type === "text" &&
                    channel.parentID === this.category) {
                    this.channels[channelToFind] = channel.id;
                    this._channels.set(channel.id, channel);
                }

                if (!this.channels[channelToFind]) {
                    allPresent = false;
                }

            });

            //check voice channels
            Object.keys(this.voiceChannels).forEach(channelToFind => {

                let channel = this.guild.channels.find(x => x.name === channelToFind);

                if (channel && channel.type === "voice" &&
                    channel.parentID === this.category) {
                    this.voiceChannels[channelToFind] = channel.id;
                    this._channels.set(channel.id, channel);
                }

                if (!this.voiceChannels[channelToFind]) {
                    allPresent = false;
                }

            });

            if (allPresent) {
                resolve(true)
            } else {
                reject(false);
            }

        });
    }

    removeAllOverwrites() {
        return new Promise((resolve, reject) => {

            for (let channel of this._channels.values()) {

                channel.permissionOverwrites.array().forEach(overwrite => {
                    overwrite.delete().catch(() => true);
                });

            }

            setTimeout(() => {
                resolve(true);
            }, 1000);

        });
    }

    async setupChannels(areChannelsReady, configuration) {

        if (!areChannelsReady) {
            await this.createChannels();
        }
        await this.removeAllOverwrites();
        await this.setupChannelPermissions(configuration);

        return true;
    }

    async createChannels() {
        return new Promise((resolve, reject) => {

            let promises = [];
            let promisesCategory = [];


            //create text channels
            Object.keys(this.channels).forEach(channelName => {
                if (!this.channels[channelName]) {
                    promises.push(this.guild.createChannel(channelName, "text"));
                }
            });

            //create voice channels
            Object.keys(this.voiceChannels).forEach(channelName => {
                if (!this.voiceChannels[channelName]) {
                    promises.push(this.guild.createChannel(channelName, "voice"));
                }
            });

            if (!this.category) {
                promisesCategory.push(this.guild.createChannel("loups_garou_de_thiercelieux", "category"));
            }

            Promise.all(promisesCategory).then((categoriesCreated) => {

                if (categoriesCreated && categoriesCreated[0]) {
                    this.category = categoriesCreated[0].id;
                    this._channels.set(categoriesCreated[0].id, categoriesCreated[0]);
                }

                return Promise.all(promises);
            }).then((channelsCreated) => {

                let otherPromises = [];

                channelsCreated.forEach(createdChannel => {

                    if (createdChannel.type === "category") {
                        this.category = createdChannel.id;
                    } else {
                        otherPromises.push(createdChannel.setParent(this.category));

                        if (createdChannel.type === "text") {
                            this.channels[createdChannel.name] = createdChannel.id;
                        } else if (createdChannel.type === "voice") {
                            this.voiceChannels[createdChannel.name] = createdChannel.id;
                        }

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
                if (channel.type === 'text') promises.push(channel.delete());
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    /**
     *
     * @param channelId String
     * @param permission Object
     * @param players Array<Player>
     * @returns {Promise<any>}
     */
    switchPermissions(channelId, permission, players) {
        return new Promise((resolve, reject) => {

            let promises = [];
            let channel = this._channels.get(channelId);

            players.forEach(player => {
                promises.push(channel.overwritePermissions(
                    player.member,
                    permission
                ));
            });

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    setupChannelPermissions(configuration) {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {

                // add mastermind permissions
                promises.push(channel.overwritePermissions(
                    this.client.user,
                    this.mastermindPermissions[channel.name]
                ));

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

    sendMessageToVillage(message, imageLink, thumbnail) {

        let village = this._channels.get(this.channels.village_lg);

        let msg = new RichEmbed()
            .addField('LG - Jeu', message)
            .setColor(BotData.BotValues.botColor)
            .setAuthor("Loup-Garou de thiercelieux", lg_var.roles_img.LoupGarou);

        if (imageLink) msg.setImage(imageLink);
        if (thumbnail) msg.setThumbnail(thumbnail);

        return village.send(msg);

    }

    sendMsgToLG(message) {
        let lg = this._channels.get(this.channels.loups_garou_lg);

        return lg.send(new RichEmbed()
            .addField("LG - Jeu", message)
            .setColor(BotData.BotValues.botColor)
        );
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
