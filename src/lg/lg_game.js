const BotData = require("../BotData.js");
const lg_var = require("./lg_var");
const LgLogger = require("./lg_logger");
const VoiceHandler = require("./lg_voice").VoiceHandler;
const GameFlow = require("./lg_flow").GameFlow;
const ChannelsHandler = require("./lg_channel").ChannelsHandler;
const RolesHandler = require("./roles/lg_role").RolesHandler;
const ReactionHandler = require("../functions/reactionHandler").ReactionHandler;
const MessageEmbed = require("discord.js").MessageEmbed;
const Wait = require('../functions/wait').Wait;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class GameInfo {

    constructor(message, playTime) {
        this.guild = message.guild;
        this.playTime = playTime;
        this._history = [];
        this.gameNumber = new Date().toUTCString().split(' ')[4];
        if (this.gameNumber) {
            this.gameNumber.replace(/:+/g, "42");
        }
    }

    addToHistory(msg) {
        this._history.push(msg);
    }

    get history() {
        return this._history;
    }

    get serverName() {
        return this.guild.name;
    }

    get stemmingTime() {
        return this.playTime;
    }

    get gameNb() {
        return this.gameNumber;
    }

    getPlayTime() {
        let minutes = (new Date() - this.playTime) / 1000 / 60;
        let hours = minutes / 60;
        let playTime = `${(minutes % 60).toFixed()}m`;
        if (hours >= 1) {
            playTime = `${hours.toFixed()}h${playTime}`;
        }

        return playTime;
    }
}

class Game extends IGame {

    constructor(client, message, gameOptions) {

        super(client);

        this.playTime = new Date();
        this.gameInfo = new GameInfo(message, this.playTime);

        LgLogger.info('New lg game created', this.gameInfo);

        this.guild = message.guild;

        this.gameOptions = gameOptions;

        this.stemmingChannel = message.channel;
        this.stemmingPlayer = message.member;

        this.preparation = new GamePreparation(
            this.client, this.stemmingChannel, this.stemmingPlayer, this.guild, this.gameInfo, gameOptions
        );
        this.flow = new GameFlow(this.client, this.gameInfo, gameOptions);

        this.quitListener = undefined;

        this.client.on('guildMemberRemove', (member) => {
            if (member.guild.id === message.guild.id) {
                if (this.preparation && this.preparation.configuration) {
                    this.preparation.configuration._players.delete(member.id);
                }
                if (this.flow && this.flow.GameConfiguration && this.flow.GameConfiguration._players) {
                    this.flow.GameConfiguration._players.delete(member.id);
                }
            }
        });

        this.msgCollector = [];
        //this.listenMsgCollector();

        return this;

    }

    async launch() {
        LgLogger.info("Preparing game...", this.gameInfo);

        let status = await this.preparation.prepareGame();

        if (!status) {
            await this.quit();
            LgLogger.info("Quitting game", this.gameInfo);
            return this;
        }

        this.updateObjects(status);

        //await this.flow.GameConfiguration.voiceHandler.join();
        //await this.flow.GameConfiguration.voiceHandler.setupEvents();
        //await this.flow.GameConfiguration.voiceHandler.playFirstDayBGM();

        LgLogger.info("Game successfully prepared.", this.gameInfo);

        await this.msg.delete();

        this.msg = await this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
            .addField(
                "Joueurs",
                this.preparation.configuration
                    .getPlayerNames()
                    .toString()
                    .replace(/,+/g, '\n')
            )
        );

        await this.listenQuitEvents();

        let msg = await this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
            .addField(
                "Le jeu va bientôt commencer", "Début du jeu dans 5 secondes"
            )
        );

        LgLogger.info(`${this.flow.GameConfiguration.getGameConfString()}`, this.gameInfo);

        await Wait.seconds(5);
        await msg.delete();

        let endMsg = await this.flow.run();

        await this.stemmingChannel.send(endMsg);
        let msgSent = await this.stemmingChannel.send("Nettoyage des channels dans 5 secondes");
        await Wait.seconds(5);
        await msgSent.delete();
        await this.quit();

        return this;
    }

    updateObjects(status) {
        let configuration = status;

        configuration.channelsHandler = this.preparation.channelsHandler;
        configuration.rolesHandler = this.preparation.rolesHandler;
        //configuration.voiceHandler = this.preparation.voiceHandler;
        //configuration.voiceHandler.voiceChannel = configuration.channelsHandler._channels.get(
        //    configuration.channelsHandler.voiceChannels.vocal_lg
        //);

        this.msg = this.preparation.msg;
        this.flow.msg = this.preparation.msg;
        this.flow.GameConfiguration = configuration;
    }

    listenQuitEvents() {
        return new Promise((resolve, reject) => {

            this.quitListener = new ReactionHandler(this.msg, ["🔚"]);

            this.quitListener.addReactions().catch(console.error);

            this.quitListener.initCollector((reaction) => {

                if (reaction.emoji.name === "🚪") {

                    //todo: allow user to quit the game

                } else if (reaction.emoji.name === "🔚") {
                    let user = reaction.users.cache.last();

                    reaction.users.remove(user).catch(() => true);
                    if (user.id === this.stemmingPlayer || this.guild.members.cache.get(user.id).hasPermission('BAN_MEMBERS')) {
                        this.quit().catch(console.error);
                    }
                }
                reaction.users.remove(reaction.users.cache.last()).catch(() => true);

            }, () => {

            }, (reaction) => {
                return reaction.count > 1;
            });

            resolve(true);

        });
    }

    quit() {
        return new Promise((resolve, reject) => {
            let LG = this.client.LG.get(this.guild.id);

            if (LG) LG.running = false;

            this.client.LG.set(this.guild.id, LG);

            if (this.quitListener) this.quitListener.stop();

            let quitPromises = [];

            if (this.flow && this.flow.GameConfiguration) {

                if (this.flow.GameConfiguration.loupGarouMsgCollector) {
                    this.flow.GameConfiguration.loupGarouMsgCollector.stop();
                }

                //if (this.flow.GameConfiguration.voiceHandler) {
                //    quitPromises.push(this.flow.GameConfiguration.voiceHandler.destroy());
                //}

            }

            quitPromises.push(this.preparation.rolesHandler.deleteRoles());

            if (this.preparation.keepChannels === false) {
                quitPromises.push(this.preparation.channelsHandler.deleteChannels());
            } else {
                quitPromises.push(this.preparation.channelsHandler.deletePermissionsOverwrites());
                quitPromises.push(this.preparation.channelsHandler.deleteMessagesInChannels());
            }

            Promise.all(quitPromises).then(() => {
                resolve(this);
            }).catch((err) => {
                this.stemmingChannel.send("Jeu arrêté, des erreurs se sont produite : ```" + err + "```").catch(console.error);
                reject(err);
            });
        });
    }

    listenMsgCollector() {

        this.client.on('message', (message) => {

            if (message && message.channel.parent) {

                if (message.channel.parent.name.toLowerCase() === "loups_garou_de_thiercelieux") {
                    this.msgCollector.push(message);
                }

            }

        });

    }
}

class GamePreparation extends IGame {

    constructor(client, channel, player, guild, gameInfo, gameOptions) {

        super(client);

        this.MAX_PLAYERS = 29;

        this.status = false;

        this.gameInfo = gameInfo;
        this.gameOptions = gameOptions;

        this.guild = guild;
        this.stemmingPlayer = player;
        this.preparationChannel = channel;
        this.configuration = new GameConfiguration(this.gameInfo);
        this.rolesHandler = new RolesHandler(client, guild, this.gameInfo);
        this.channelsHandler = new ChannelsHandler(client, guild, this.gameInfo);
        //this.voiceHandler = new VoiceHandler(this.channelsHandler._channels.get(this.channelsHandler.voiceChannels.vocal_lg), gameOptions.musicMode);

        this.msg = undefined;
        this.MessageEmbed = undefined;

        this.keepChannels = false;

        return this;

    }

    prepareGame() {
        return new Promise((resolve, reject) => {
            this.init()
                .then(() => this.createRoles())
                .then(() => this.displayGuide())
                .then(() => this.initEvents())
                .then(status => {
                    if (!status) return resolve(status);
                    return this.setupChannels()
                })
                .then(() => this.rolesHandler.sendRolesToPlayers(this.configuration))
                .then(() => resolve(this.configuration))
                .catch(err => reject(err));
        });
    }

    init() {
        return new Promise((resolve, reject) => {

            this.MessageEmbed = CommunicationHandler.getLGSampleMsg()
                .addField("LG - Initialisation", "Initialisation du jeu...");

            this.preparationChannel.send(this.MessageEmbed).then(msg => {
                this.msg = msg;
                resolve(true);
            }).catch(err => reject(err));
        });
    }

    createRoles() {
        return new Promise((resolve, reject) => {
            this.rolesHandler.createRoles().then(() => resolve(true)).catch(err => {
                this.msg.edit(this.MessageEmbed.setDescription("Erreur lors de la création des rôles.")).catch(() => true);
                reject(err);
            });
        });
    }

    displayGuide() {
        return new Promise((resolve, reject) => {
            this.MessageEmbed = CommunicationHandler.getLGSampleMsg()
                .setDescription("Préparation du jeu")
                .setThumbnail(lg_var.roles_img.LoupGarou)
                .addField("Rejoindre la partie", "Veuillez réagir avec la réaction 🐺", true)
                .addField("Quitter la partie", "Veuillez réagir avec la réaction 🚪", true)
                .addField("Lancer la partie", `Seul ${this.stemmingPlayer.displayName} peut lancer la partie avec ❇`, true)
                .addField("Stopper la partie", "Veuillez réagir avec la réaction 🔚", true)
                .addField("Joueurs participants au jeu", "Aucun participant pour le moment");

            this.msg.edit(this.MessageEmbed).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    initEvents() {
        return new Promise((resolve, reject) => {

            let gamePreparationMsg = new ReactionHandler(this.msg, ["🐺", "🚪", "❇", "🔚"]);

            gamePreparationMsg.addReactions().catch(err => reject(err));

            gamePreparationMsg.initCollector((reaction) => {

                this.guild.members.fetch(reaction.users.cache.last().id).then(guildMember => {

                    if (!guildMember) {
                        console.error(`${reaction.users.cache.last().username} non présent sur le serveur ${this.guild.name}`);
                        return;
                    }

                    if (reaction.emoji.name === "🐺") {
                        this.configuration.addParticipant(guildMember);
                        this.rolesHandler.addPlayerRole(guildMember).catch(console.error);
                        this.updateParticipantsDisplay();
                        reaction.users.remove(guildMember.user).catch(() => true);
                        if (this.configuration.getParticipantsNames().length === this.MAX_PLAYERS) {
                            this.status = true;
                            gamePreparationMsg.collector.stop();
                        }
                    } else if (reaction.emoji.name === "🚪") {
                        this.rolesHandler.removeRoles(guildMember);
                        this.configuration.removeParticipant(guildMember.id);
                        this.updateParticipantsDisplay();
                        reaction.users.remove(guildMember.user).catch(() => true);
                    } else if (reaction.emoji.name === "❇") {
                        reaction.users.remove(guildMember.user).catch(() => true);
                        if (guildMember.id === this.stemmingPlayer.id || guildMember.hasPermission('BAN_MEMBERS')) {
                            if (this.configuration.getParticipantsNames().length > 1) {
                                this.status = true;
                                gamePreparationMsg.collector.stop();
                            }
                        }
                    } else if (reaction.emoji.name === "🔚") {
                        reaction.users.remove(guildMember.user).catch(() => true);
                        if (guildMember.id === this.stemmingPlayer.id || guildMember.hasPermission('BAN_MEMBERS')) {
                            this.status = false;
                            gamePreparationMsg.collector.stop();
                        }
                    }

                }).catch(() => true);

            }, () => {
                if (this.status === false) {
                    gamePreparationMsg.message.delete().catch(() => true);
                    LgLogger.info("User decided to end game", this.gameInfo);
                    resolve(false);
                } else {
                    gamePreparationMsg.removeReactionList(["🐺", "❇"]).catch(() => true);
                    this.rolesHandler.assignRoles(this.configuration)
                        .then((configuration) => {
                            this.configuration = configuration;
                            resolve(this.status);
                        })
                        .catch(err => reject(err));
                }
            }, (reaction) => reaction.count > 1 && reaction.users.cache.last().id !== this.client.user.id);
        });
    }

    setupChannels() {
        return new Promise((resolve, reject) => {
            this.checkChannels().then((areChannelsReady) => {
                return this.channelsHandler.setupChannels(areChannelsReady, this.configuration);
            }).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    checkChannels() {
        return new Promise((resolve, reject) => {

            this.channelsHandler.checkChannelsOnGuild().then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });

        });
    }

    updateParticipantsDisplay() {
        this.MessageEmbed.fields[this.MessageEmbed.fields.length - 1].value = this.configuration
            .getParticipantsNames()
            .toString()
            .replace(/,+/g, "\n");
        if (this.MessageEmbed.fields[this.MessageEmbed.fields.length - 1].value === "") {
            this.MessageEmbed.fields[this.MessageEmbed.fields.length - 1].value = "Aucun participant pour le moment";
        }
        this.MessageEmbed.setFooter(`Nombre de joueurs : ${this.configuration.getParticipantsNames().length}`);
        this.msg.edit(this.MessageEmbed).catch(() => true);
    }

    askForChannelGeneration() {
        return new Promise((resolve, reject) => {
            this.preparationChannel.send(CommunicationHandler.getLGSampleMsg()
                .setTitle("Voulez-vous garder les salons nécessaires au jeu sur le serveur discord une fois la partie terminée ?")
                .setDescription("Garder les salons sur le serveur discord permet de ne plus les générer par la suite")
                .addField("✅", "Garder les salons sur le serveur")
                .addField("❎", "Supprimer les salons du serveur une fois la partie terminée")
            ).then(msg => {

                let question = new ReactionHandler(msg, ["✅", "❎"]);

                question.addReactions().then(() => {

                    question.initCollector((reaction) => {
                        let r = reaction.emoji.name;

                        if (r === "✅") {
                            this.keepChannels = true;
                            question.stop();
                        } else if (r === "❎") {
                            this.keepChannels = false;
                            question.stop();
                        }

                    }, () => {
                        msg.delete().then(() => resolve(this.keepChannels)).catch(() => resolve(this.keepChannels));
                    }, (reaction) => {
                        let user = reaction.users.last();
                        return reaction.count > 1 && (user.id === this.stemmingPlayer || this.guild.members.get(user.id).hasPermission('BAN_MEMBERS'))
                    });

                }).catch(err => reject(err));

            }).catch(err => reject(err));

        })
    }

}

class GameConfiguration {

    constructor(gameInfo) {

        this.gameInfo = gameInfo;
        this.globalTimer = null;

        this._table = [];

        // players of the game, mapped by id, we store here LG game role objects like LoupBlanc()
        this._players = new Map();

        // participants mapped by their Id, we store here only GuildMember objects for game preparation
        this._participants = new Map();

        this.channelsHandler = undefined;
        this.rolesHandler = undefined;
        //this.voiceHandler = undefined;

    }

    getLGChannel() {
        return this.channelsHandler._channels.get(this.channelsHandler.channels.loups_garou_lg);
    }

    get villageChannel() {
        return this.channelsHandler._channels.get(this.channelsHandler.channels.village_lg);
    }

    get Capitaine() {

        for (let player of this._players.values()) {
            if (player.capitaine) return player;
        }

        return null;
    }

    getPlayerById(id) {
        return this._players.get(id);
    }

    getGameConfString() {

        let str = '';

        for (let player of this._players.values()) {
            str += `${player.member.displayName} : ${player.role}, `;
        }

        return str.slice(0, str.length - 2);

    }

    getParticipants() {
        return this._participants;
    }

    addParticipant(guildMember) {
        this._participants.set(guildMember.id, guildMember);
    }

    removeParticipant(id) {
        this._participants.delete(id);
    }

    getTable() {
        if (this._table.length === 0) {
            this._table = Array.from(this._participants.values());
        }
        return this._table;
    }

    getParticipantsNames() {
        let participantsNames = [];

        for (let participant of this._participants.values()) {
            participantsNames.push(participant.displayName);
        }

        return participantsNames;
    }

    getPlayerNames() {
        let playerNames = [];

        for (let player of this._players.values()) {
            playerNames.push(player.member.displayName);
        }

        return playerNames;
    }

    getMemberteams(team) {
        let lgNames = [];

        for (let player of this._players.values()) {
            if (player.team === team) lgNames.push(`**${player.role}** : ${player.member.displayName}`);
        }

        return lgNames;
    }

    getPlayersIdName() {

        let playersIdName = new Map();

        for (let [id, player] of this._players) {
            playersIdName.set(id, player.member.displayName);
        }

        return playersIdName;

    }

    getPlayers() {
        return this._players;
    }

    getDeadPlayers() {
        let players = [];

        for (let player of this._players.values()) {
            if (!player.alive) players.push(player);
        }

        return players;
    }

    getAlivePlayers() {
        let players = [];

        for (let player of this._players.values()) {
            if (player.alive) players.push(player);
        }

        return players;
    }

    addPlayer(player) {
        this._players.set(player.member.id, player);
    }

    removePlayer(id) {
        this._players.delete(id);
    }

    getRoleMap(options) {

        let roleMap = new Map();

        let array;
        for (let player of this._players.values()) {

            array = roleMap.get(player.role);

            if (!array) {
                if ((options.alive && options.dead) ||
                    (options.alive && !options.dead && player.alive) ||
                    (!options.alive && options.dead && !player.alive)) {
                    roleMap.set(player.role, [player]);
                }
            } else if ((options.alive && options.dead) ||
                (options.alive && !options.dead && player.alive) ||
                (!options.alive && options.dead && !player.alive)) {

                array.push(player);
                roleMap.set(player.role, array);

            }

        }

        return roleMap;

    }

    getLG(onlyAlive) {

        let lgs = [];

        for (let player of this._players.values()) {
            if (player.team === "LG") {
                if (onlyAlive) {
                    if (player.alive) lgs.push(player);
                } else {
                    lgs.push(player);
                }
            }
        }

        return lgs;
    }

    getLGIds(onlyAlive) {
        let lgIds = [];

        for (let [id, player] of this._players) {
            if (player.team === "LG") {
                if (onlyAlive) {
                    if (player.alive) lgIds.push(id);
                } else {
                    lgIds.push(id);
                }
            }
        }

        return lgIds;
    }

    /**
     *
     * @param includeDead specifies if you want to include dead villageois as well as alive villageois
     * @returns {Array}
     */
    getVillageois(includeDead) {

        if (includeDead === undefined) includeDead = true;

        let villageois = [];

        for (let player of this._players.values()) {
            if (player.team === "VILLAGEOIS") {
                if (!includeDead) {
                    if (player.alive) villageois.push(player);
                } else {
                    villageois.push(player);
                }
            }
        }

        return villageois;
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

module.exports = {Game, IGame};
