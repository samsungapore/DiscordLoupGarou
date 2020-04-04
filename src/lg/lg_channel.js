const BotData = require("../BotData.js");
const lg_var = require("./lg_var");
const LgLogger = require("./lg_logger");
const MessageEmbed = require("discord.js").MessageEmbed;

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

        this.everyoneRole = this.guild.roles.everyone;
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

        let results = await Promise.allSettled([
            this.checkCategory(),
            this.checkChannels()
        ]);

        for (const result of results) {
            if (result.status === "rejected") {
                LgLogger.info('Channels are not ready', this.gameInfo);
                throw `${result.reason}`;
            }
        }

        return true;
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    checkCategory() {
        return new Promise((resolve, reject) => {

            let channel = this.guild.channels.cache.find(x => x.name === "loups_garou_de_thiercelieux");

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

                let channel = this.guild.channels.cache.find(x => x.name === channelToFind);

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

                let channel = this.guild.channels.cache.find(x => x.name === channelToFind);

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

    async removeAllOverwrites() {

        let promises = [];

        for (let channel of this._channels.values()) {

            channel.permissionOverwrites.array().forEach(overwrite => {
                promises.push(overwrite.delete());
            });

        }

        await Promise.allSettled(promises);

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

        let promises = [];

        if (!this.category) {
            let categoriesCreated = await this.guild.channels.create("loups_garou_de_thiercelieux", {type: 'category'});
            this.category = categoriesCreated.id;
            this._channels.set(categoriesCreated.id, categoriesCreated);
        }

        //create text channels
        Object.keys(this.channels).forEach(channelName => {
            if (!this.channels[channelName]) {
                promises.push(this.guild.channels.create(channelName, {
                    type: "text",
                    parent: this._channels.get(this.category)
                }));
            }
        });

        //create voice channels
        Object.keys(this.voiceChannels).forEach(channelName => {
            if (!this.voiceChannels[channelName]) {
                promises.push(this.guild.channels.create(channelName, {
                    type: "voice",
                    parent: this._channels.get(this.category)
                }));
            }
        });

        let channelsCreated = await Promise.all(promises);

        channelsCreated.forEach(createdChannel => {

            if (createdChannel.type === "text") {
                this.channels[createdChannel.name] = createdChannel.id;
            } else if (createdChannel.type === "voice") {
                this.voiceChannels[createdChannel.name] = createdChannel.id;
            }

            this._channels.set(createdChannel.id, createdChannel);

        });


    }

    deleteChannels() {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {
                if (channel.type === 'text') promises.push(channel.delete());
            }

            Promise.allSettled(promises).then(() => resolve(true)).catch(() => true);

        });
    }

    /**
     *
     * @param channelId String
     * @param permission Object
     * @param players Array<Player>
     * @returns {Promise<any>}
     */
    async switchPermissions(channelId, permission, players) {

        let promises = [];
        let channel = this._channels.get(channelId);

        players.forEach(player => {
            promises.push(channel.createOverwrite(
                player.member,
                permission
            ));
        });

        await Promise.all(promises);
    }

    setupChannelPermissions(configuration) {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of Array.from(this._channels.values()).filter(channel => channel.type === 'text')) {

                // add mastermind permissions
                promises.push(channel.createOverwrite(
                    this.client.user,
                    this.mastermindPermissions[channel.name]
                ));

                promises.push(this.applyPermissionsOnChannel(channel, configuration.getPlayers()));
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    async applyPermissionsOnChannel(channel, players) {

        let promises = [];

        if (channel.type !== "category") {

            for (let player of players.values()) {
                promises.push(channel.createOverwrite(
                    player.member,
                    player.permission[channel.name]
                ));
            }

        }

        promises.push(channel.createOverwrite(
            this.everyoneRole,
            this.everyonePermission[channel.name]
        ));

        await Promise.all(promises);
    }

    sendMessageToVillage(message, imageLink, thumbnail) {

        let village = this._channels.get(this.channels.village_lg);

        let msg = new MessageEmbed()
            .addField('LG - Jeu', message)
            .setColor(BotData.BotValues.botColor)
            .setAuthor("Loup-Garou de thiercelieux", lg_var.roles_img.LoupGarou);

        if (imageLink) msg.setImage(imageLink);
        if (thumbnail) msg.setThumbnail(thumbnail);

        return village.send(msg);

    }

    sendMsgToLG(message) {
        let lg = this._channels.get(this.channels.loups_garou_lg);

        return lg.send(new MessageEmbed()
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

    async deleteMessagesInChannel(channel) {
        await channel.bulkDelete(channel.messages.cache, true);
    }

}

module.exports = {ChannelsHandler};
