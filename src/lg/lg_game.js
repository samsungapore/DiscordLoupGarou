const BotData = require("../BotData.js");
const lg_var = require("./lg_var");
const GameFlow = require("./lg_flow").GameFlow;
const ChannelsHandler = require("./lg_channel").ChannelsHandler;
const RolesHandler = require("./roles/lg_role").RolesHandler;
const ReactionHandler = require("../functions/reactionHandler").ReactionHandler;
const RichEmbed = require("discord.js").RichEmbed;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class Game extends IGame {

    constructor(client, message) {

        super(client);

        this.guild = message.guild;

        this.playTime = new Date();

        this.stemmingChannel = message.channel;
        this.stemmingPlayer = message.member;

        this.preparation = new GamePreparation(
            this.client, this.stemmingChannel, this.stemmingPlayer, this.guild
        );
        this.flow = new GameFlow(this.client);

        this.quitListener = undefined;

        return this;

    }

    launch() {
        this.preparation.prepareGame().then(status => {
            if (!status) {
                this.quit();
                return;
            }

            this.updateObjects(status);

            return this.msg.delete();

        }).then(() => {

            return this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
                .addField("Joueurs", this.preparation.configuration.getPlayerNames().toString())
            );

        }).then(msg => {

            this.msg = msg;

            return this.listenQuitEvents();

        }).then(() => this.flow.run()).then((configuration) => {

            this.stemmingChannel.send("Test réussi").catch(console.error);
            console.info(configuration);
            this.quit();

        }).catch(err => {

            this.stemmingChannel.send("Test échoué\n```" + err + "```").catch(console.error);
            console.error(err);
            this.quit();

        });
    }

    updateObjects(status) {
        let configuration = status;

        configuration.channelsHandler = this.preparation.channelsHandler;
        configuration.rolesHandler = this.preparation.rolesHandler;

        this.msg = this.preparation.msg;
        this.flow.msg = this.preparation.msg;
        this.flow.GameConfiguration = configuration;
    }

    listenQuitEvents() {
        return new Promise((resolve, reject) => {

            this.quitListener = new ReactionHandler(this.msg);

            this.quitListener.initCollector((reaction) => {

                if (reaction.emoji.name === "🚪") {

                    //todo: allow user to quit the game

                } else if (reaction.emoji.name === "🔚") {
                    let user = reaction.users.last();

                    reaction.remove(user).catch(() => true);
                    if (user.id === this.stemmingPlayer || this.guild.members.get(user.id).hasPermission('BAN_MEMBERS')) {
                        this.quit();
                    }
                }
                reaction.remove(reaction.users.last()).catch(() => true);

            }, () => {

            }, (reaction) => {
                return reaction.count > 1;
            });

            resolve(true);

        });
    }

    quit() {

        let LG = this.client.LG.get(this.guild.id);

        LG.running = false;

        if (this.quitListener) this.quitListener.stop();

        let quitPromises = [];

        quitPromises.push(this.preparation.rolesHandler.deleteRoles());

        if (this.preparation.keepChannels === false) {
            quitPromises.push(this.preparation.channelsHandler.deleteChannels());
        } else {

            quitPromises.push(this.preparation.channelsHandler.deletePermissionsOverwrites());
            quitPromises.push(this.preparation.channelsHandler.deleteMessagesInChannels());

        }

        let minutes = (new Date() - this.playTime) / 1000 / 60;
        let hours = minutes / 60;
        let playTime = `${(minutes % 60).toFixed()}m`;
        if (hours >= 1) {
            playTime = `${hours.toFixed()}h${playTime}`;
        }

        Promise.all(quitPromises).then(() => {
            this.stemmingChannel.send("Jeu arrêté, après " + playTime + " de jeu.").catch(console.error);
        }).catch((err) => {
            console.error(err);
            this.stemmingChannel.send("Jeu arrêté, des erreurs se sont produite : ```" + err + "```").catch(console.error);
        });
    }

}

class GamePreparation extends IGame {

    constructor(client, channel, player, guild) {

        super(client);

        this.status = false;

        this.guild = guild;
        this.stemmingPlayer = player;
        this.preparationChannel = channel;
        this.configuration = new GameConfiguration();
        this.rolesHandler = new RolesHandler(client, guild);
        this.channelsHandler = new ChannelsHandler(client, guild);

        this.msg = undefined;
        this.richEmbed = undefined;

        this.keepChannels = false;

        return this;

    }

    updateParticipantsDisplay() {
        this.richEmbed.fields[this.richEmbed.fields.length - 1].value = this.configuration.getParticipantsNames().toString();
        if (this.richEmbed.fields[this.richEmbed.fields.length - 1].value === "") {
            this.richEmbed.fields[this.richEmbed.fields.length - 1].value = "Aucun participant pour le moment";
        }
        this.msg.edit(this.richEmbed).catch(console.error);
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

            this.richEmbed = CommunicationHandler.getLGSampleMsg()
                .addField("LG - Initialisation", "Initialisation du jeu...");

            this.preparationChannel.send(this.richEmbed).then(msg => {
                this.msg = msg;
                resolve(true);
            }).catch(err => reject(err));
        });
    }

    createRoles() {
        return new Promise((resolve, reject) => {
            this.rolesHandler.createRoles().then(() => resolve(true)).catch(err => {
                this.msg.edit(this.richEmbed.setDescription("Erreur lors de la création des rôles.")).catch(console.error);
                reject(err);
            });
        });
    }

    displayGuide() {
        return new Promise((resolve, reject) => {
            this.richEmbed = CommunicationHandler.getLGSampleMsg()
                .setDescription("Préparation du jeu")
                .setThumbnail(lg_var.roles_img.LoupGarou)
                .addField("Rejoindre la partie", "Veuillez réagir avec la réaction 🐺", true)
                .addField("Quitter la partie", "Veuillez réagir avec la réaction 🚪", true)
                .addField("Lancer la partie", `Seul ${this.stemmingPlayer.displayName} peut lancer la partie avec ❇`, true)
                .addField("Stopper la partie", "Veuillez réagir avec la réaction 🔚", true)
                .addField("Joueurs participants au jeu", "Aucun participant pour le moment");

            this.msg.edit(this.richEmbed).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    initEvents() {
        return new Promise((resolve, reject) => {

            let gamePreparationMsg = new ReactionHandler(this.msg, ["🐺", "🚪", "❇", "🔚"]);

            gamePreparationMsg.addReactions().catch(err => reject(err));

            gamePreparationMsg.initCollector((reaction) => {

                let guildMember = this.guild.members.get(reaction.users.last().id);

                if (!guildMember) {
                    console.error(`${reaction.users.last().username} non présent sur le serveur ${this.guild.name}`);
                    return;
                }

                if (reaction.emoji.name === "🐺") {
                    this.configuration.addParticipant(guildMember);
                    this.rolesHandler.addPlayerRole(guildMember).catch(console.error);
                    this.updateParticipantsDisplay();
                    reaction.remove(guildMember.user).catch(console.error);
                } else if (reaction.emoji.name === "🚪") {
                    this.rolesHandler.removePlayerRole(guildMember);
                    this.configuration.removeParticipant(guildMember.id);
                    this.updateParticipantsDisplay();
                    reaction.remove(guildMember.user).catch(console.error);
                } else if (reaction.emoji.name === "❇") {
                    reaction.remove(guildMember.user).catch(console.error);
                    if (guildMember.id === this.stemmingPlayer.id || guildMember.hasPermission('BAN_MEMBERS')) {
                        this.status = true;
                        gamePreparationMsg.collector.stop();
                    }
                } else if (reaction.emoji.name === "🔚") {
                    reaction.remove(guildMember.user).catch(console.error);
                    if (guildMember.id === this.stemmingPlayer.id || guildMember.hasPermission('BAN_MEMBERS')) {
                        this.status = false;
                        gamePreparationMsg.collector.stop();
                    }
                }

            }, () => {
                gamePreparationMsg.removeReactionList(["🐺", "❇"]).catch(console.error);
                this.rolesHandler.assignRoles(this.configuration)
                    .then((configuration) => {
                        this.configuration = configuration;
                        resolve(this.status);
                    })
                    .catch(err => reject(err));
            }, (reaction) => reaction.count > 1 && reaction.users.last().id !== this.client.user.id);
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
                if (this.stemmingPlayer.hasPermission("BAN_MEMBERS")) {
                    this.askForChannelGeneration().then(() => resolve(true)).catch(err => reject(err));
                } else {
                    resolve(true);
                }
            }).catch(() => {
                if (this.stemmingPlayer.hasPermission("BAN_MEMBERS")) {
                    this.askForChannelGeneration().then(() => resolve(false)).catch(err => reject(err));
                } else {
                    resolve(false);
                }
            });

        });
    }

}

class GameConfiguration {

    constructor() {

        this._table = [];

        // players of the game, mapped by id, we store here LG game role objects like LoupBlanc()
        this._players = new Map();

        // participants mapped by their Id, we store here only GuildMember objects for game preparation
        this._participants = new Map();

        this.channelsHandler = undefined;
        this.rolesHandler = undefined;

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

    addPlayer(player) {
        this._players.set(player.member.id, player);
    }

    removePlayer(id) {
        this._players.delete(id);
    }

    getRoleMap() {

        let roleMap = new Map();

        let array;
        for (let player of this._players.values()) {

            array = roleMap.get(player.role);

            if (!array) {
                roleMap.set(player.role, [player]);
            } else {
                array.push(player);
                roleMap.set(player.role, array);
            }

        }

        return roleMap;

    }

}

class CommunicationHandler extends IGame {

    constructor(client, message) {

        super(client);

        return this;

    }

    static getLGSampleMsg() {
        return new RichEmbed()
            .setColor(BotData.BotValues.botColor)
            .setAuthor("Loup-Garou de Thiercelieux", lg_var.roles_img.LoupGarou);
    }

    static reconstructEmbed(messageEmbed) {

        let newEmbed = new RichEmbed();

        if (messageEmbed.author) newEmbed.setAuthor(messageEmbed.author);
        if (messageEmbed.color) newEmbed.setColor(messageEmbed.color);
        if (messageEmbed.description) newEmbed.setDescription(messageEmbed.description);
        if (messageEmbed.footer) newEmbed.setFooter(messageEmbed.footer);
        if (messageEmbed.image) newEmbed.setImage(messageEmbed.image);
        if (messageEmbed.thumbnail) newEmbed.setThumbnail(messageEmbed.thumbnail);
        if (messageEmbed.title) newEmbed.setTitle(messageEmbed.title);
        if (messageEmbed.url) newEmbed.setURL(messageEmbed.url);

        messageEmbed.fields.forEach(field => {

            if (field.name === '\u200B' && field.value === '\u200B') {
                newEmbed.addBlankField(field.inline);
            } else {
                newEmbed.addField(field.name, field.value, field.inline);
            }

        });

        return newEmbed;
    }

}

module.exports = {Game, IGame};
