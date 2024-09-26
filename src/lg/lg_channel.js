const BotData = require("../BotData.js");
const lg_var = require("./lg_var");
const LgLogger = require("./lg_logger");
const MessageEmbed = require("../utils/embed");
const {ChannelType, PermissionsBitField} = require("discord.js");
const {transformPermissions} = require("../utils/permission");
const {sendEmbed} = require("../utils/message");


class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class ChannelsHandler extends IGame {

    /**
     *
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Guild} guild
     * @param {GameInfo} gameInfo
     * @returns {ChannelsHandler}
     */
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
        this.gameChannel = undefined;

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

            if (channel && channel.type === ChannelType.GuildCategory) {
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

                /**
                 * @type {TextChannel} channel
                 */
                let channel = this.guild.channels.cache.find(x => x.name === channelToFind);

                if (channel && channel.type === ChannelType.GuildText &&
                    channel.parentId === this.category) {
                    this.channels[channelToFind] = channel.id;
                    this._channels.set(channel.id, channel);
                }

                if (!this.channels[channelToFind]) {
                    allPresent = false;
                }

            });

            //check voice channels
            Object.keys(this.voiceChannels).forEach(channelToFind => {

                /**
                 * @type {TextChannel} channel
                 */
                let channel = this.guild.channels.cache.find(x => x.name === channelToFind);

                if (channel && channel.type === ChannelType.GuildVoice &&
                    channel.parentId === this.category) {
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

            channel.permissionOverwrites.cache.each(overwrite => {
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
            let categoriesCreated = await this.guild.channels.create({
                name: "loups_garou_de_thiercelieux",
                type: ChannelType.GuildCategory
            });
            this.category = categoriesCreated.id;
            this._channels.set(categoriesCreated.id, categoriesCreated);
        }

        //create text channels
        Object.keys(this.channels).forEach(channelName => {
            if (!this.channels[channelName]) {
                promises.push(this.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: this._channels.get(this.category)
                }));
            }
        });

        //create voice channels
        Object.keys(this.voiceChannels).forEach(channelName => {
            if (!this.voiceChannels[channelName]) {
                promises.push(this.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: this._channels.get(this.category)
                }));
            }
        });

        let channelsCreated = await Promise.all(promises);

        channelsCreated.forEach(createdChannel => {

            if (createdChannel.type === ChannelType.GuildText) {
                this.channels[createdChannel.name] = createdChannel.id;
            } else if (createdChannel.type === ChannelType.GuildVoice) {
                this.voiceChannels[createdChannel.name] = createdChannel.id;
            }

            this._channels.set(createdChannel.id, createdChannel);

        });


    }

    deleteChannels() {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of this._channels.values()) {
                if (channel.type === ChannelType.GuildText) promises.push(channel.delete());
            }

            Promise.allSettled(promises).then(() => resolve(true)).catch(() => true);

        });
    }

    /**
     * Creates permission overwrites for a user or role in this channel, or replaces them if already present.
     * @param {RoleResolvable|UserResolvable} userOrRole The user or role to update
     * @param {PermissionOverwriteOptions} options The options for the update
     * @param {GuildChannelOverwriteOptions} [overwriteOptions] The extra information for the update
     * @returns {Promise<GuildChannel>}
     * @example
     * // Create or Replace permission overwrites for a message author
     * message.channel.permissionOverwrites.create(message.author, {
     *   SendMessages: false
     * })
     *   .then(channel => console.log(channel.permissionOverwrites.cache.get(message.author.id)))
     *   .catch(console.error);
     */

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
            promises.push(channel.permissionOverwrites.create(
                player.member,
                transformPermissions(permission)
            ));
        });

        await Promise.all(promises);
    }

    setupChannelPermissions(configuration) {
        return new Promise((resolve, reject) => {

            let promises = [];

            for (let channel of Array.from(this._channels.values()).filter(channel => channel.type === ChannelType.GuildText)) {

                // add mastermind permissions
                promises.push(channel.permissionOverwrites.create(
                    this.client.user,
                    transformPermissions(this.mastermindPermissions[channel.name])
                ));

                promises.push(this.applyPermissionsOnChannel(channel, configuration.getPlayers()));
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    async applyPermissionsOnChannel(channel, players) {

        let promises = [];

        if (channel.type !== ChannelType.GuildCategory) {

            for (let player of players.values()) {
                promises.push(channel.permissionOverwrites.create(
                    player.member,
                    transformPermissions(player.permission[channel.name])
                ));
            }

        }

        promises.push(channel.permissionOverwrites.create(
            this.everyoneRole,
            transformPermissions(this.everyonePermission[channel.name])
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

        return sendEmbed(village, msg);

    }

    sendMsgToLG(message) {
        let lg = this._channels.get(this.channels.loups_garou_lg);

        return sendEmbed(lg, new MessageEmbed()
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
