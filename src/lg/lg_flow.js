const RichEmbed = require("discord.js").RichEmbed;
const BotData = require("../BotData.js");
const lg_var = require('./lg_var.js');
const LgLogger = require("./lg_logger");
const allRoles = require("./roles/roleFactory").allRoles;
const Wait = require("../functions/wait.js").Wait;
const VillageoisVote = require("./lg_vote.js").VillageoisVote;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class GameFlow extends IGame {

    constructor(client, gameInfo) {

        super(client);

        this.gameInfo = gameInfo;

        this.GameConfiguration = null;
        this.msg = null;

        this.turnNb = 0;

        return this;

    }

    run() {
        return new Promise((resolve, reject) => {

            LgLogger.info('Game start', this.gameInfo);

            this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg)
                .send(new RichEmbed().setColor(BotData.BotValues.botColor)
                    .setAuthor("Les Loups-garous de Thiercelieux [v2.1]", lg_var.roles_img.LoupGarou)
                    .setDescription('Développé par Kazuhiro#1248.\n\n*Thiercelieux est un petit village rural d\'apparence paisible,' +
                        ' mais chaque nuit certains villageois se transforment en loups-garou pour dévorer d\'autres villageois...*\n')
                    .addField("Règles :",
                        'Les joueurs sont divisés en deux camps : les villageois (certains d\'entre eux jouant ' +
                        'un rôle spécial) et les loups-garou. Le but des villageois est de découvrir et d\'éliminer ' +
                        'les loups-garou, et le but des loups-garou est d\'éliminer tous les villageois.\nPour ' +
                        'les amoureux, leur but est de survivre tous les deux jusqu\'à la fin de la partie.')
                    .setFooter("Bienvenue à Thiercelieux, sa campagne paisible, son école charmante, sa population accueillante, ainsi que " +
                        "ses traditions ancestrales et ses mystères inquiétants.", lg_var.roles_img.LoupGarou)
                    .setImage(lg_var.roles_img.LoupGarou)).catch(err => reject(err));


            new FirstDay(this.GameConfiguration, this.gameInfo).goThrough().then((conf) => {

                this.GameConfiguration = conf;
                return new FirstNight(this.GameConfiguration, this.gameInfo).goThrough();

            }).then((conf) => {

                this.GameConfiguration = conf;
                return this.gameLoop();

            }).then(() => {
                resolve(true);
            }).catch(err => reject(err));

        });
    }

    async gameLoop() {

        let end;
        do {
            end = await new Day(this.GameConfiguration, this.gameInfo).goThrough();

            if (end) break;

            end = await new Night(this.GameConfiguration, this.gameInfo).goThrough();

            this.turnNb += 1;

        } while (end !== true && this.turnNb < 5);

        LgLogger.info("Game is over", this.gameInfo);

    }

}

class Period {

    constructor(configuration, gameInfo) {

        this.GameConfiguration = configuration;

        this.gameInfo = gameInfo;

        this.roleMap = this.GameConfiguration.getRoleMap();

        return this;

    }

}

class Day extends Period {

    goThrough() {
        return new Promise((resolve, reject) => {
            LgLogger.info("Going through day", this.gameInfo);
            resolve(false);
        })
    }

}

class FirstDay extends Period {

    constructor(configuration, gameInfo) {

        super(configuration, gameInfo);

        return this;
    }

    goThrough() {
        return new Promise((resolve, reject) => {

            return resolve(this.GameConfiguration);

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "🌄 Le jour se lève à Thiercelieux." +
                " Quand la neige éternelle ornera les montagnes, le maire devra être élu."
            ).then(() => Wait.minutes(1))
                .then(() => this.maireElection())
                .then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage("⛰ La nuit va bientôt tomber sur Thiercelieux."))
                .then(() => Wait.seconds(30))
                .then(() => resolve(this.GameConfiguration))
                .catch(err => reject(err));

        });
    }

    maireElection() {
        return new Promise((resolve, reject) => {

            LgLogger.info('Begining maire election.', this.gameInfo);

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "🏔 Les villageois se réunissent afin d'élir leur maire\n" +
                "C'est l'heure du vote !"
            ).then(() => {

                return this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
                    {
                        'VIEW_CHANNEL': true,
                        'SEND_MESSAGES': true,
                        'ADD_REACTIONS': true
                    },
                    this.GameConfiguration.getPlayers()
                );

            }).then(() => {

                LgLogger.info('Permissions switch, init referendum.', this.gameInfo);

                return new VillageoisVote(
                    "Qui voulez-vous élir comme maire ?",
                    this.GameConfiguration,
                    120000,
                    this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg),
                    this.GameConfiguration._players.size
                ).everyone();

            }).then((outcome) => {

                LgLogger.info("Maire outcome : " + outcome, this.gameInfo);

                if (outcome.length === 0) {
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "Le village n'a pas voulu élire de Maire."
                    ).catch(console.error);
                } else if (outcome.length === 1) {
                    let id = outcome.shift();
                    let maireElected = this.GameConfiguration._players.get(id);

                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        `${maireElected.member.displayName} a été élu Maire de Thiercelieux !`
                    ).catch(console.error);
                    maireElected.maire = true;
                    this.GameConfiguration._players.set(id, maireElected);
                    this.GameConfiguration.maire = maireElected;
                } else if (outcome.length > 1) {
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "Le village n'a pas pu élire de Maire, les votes étant trop serrés."
                    ).catch(console.error);
                }

                return this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
                    {
                        'VIEW_CHANNEL': true,
                        'SEND_MESSAGES': false,
                        'ADD_REACTIONS': true
                    },
                    this.GameConfiguration.getPlayers()
                );

            }).then(() => {
                resolve(this.GameConfiguration);
            }).catch(err => reject(err));

        })
    }

}

class Night extends Period {

    constructor(configuration, gameInfo) {

        super(configuration, gameInfo);

        return this;

    }

    initRole(roleName) {
        return new Promise((resolve, reject) => {
            let roles = this.roleMap.get(roleName);

            if (!roles || roles.length < 1) {
                return resolve(false);
            }

            let role = roles.shift();

            LgLogger.warn(role, this.gameInfo);

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Le **${roleName}** se réveille.`
            ).catch(err => LgLogger.warn(err));

            resolve(role);
        });
    }

    goThrough() {
        return new Promise((resolve, reject) => {

            LgLogger.info("Going through night", this.gameInfo);
            this.GameConfiguration.channelsHandler.sendMessageToVillage("🌌 La nuit tombe.")
                .then(() => Promise.all([
                    this.callLoupsGarou(),
                    this.callJoueurDeFlute(),
                    this.callSalvateur()
                ]))
                .then(() => Promise.all([
                    this.callVoyante(),
                    this.callChaman(),
                    this.callInfectPereDesLoups(),
                    this.callFrereSoeurs()
                ]))
                .then(() => Promise.all([
                    this.callSorciere(),
                    this.callRenard()
                ]))
                .then(() => resolve(false))
                .catch(err => reject(err));

        });
    }

    callLoupsGarou() {
        return new Promise((resolve, reject) => {



            resolve(true);
        });
    }

    callJoueurDeFlute() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callSalvateur() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callVoyante() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callChaman() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callInfectPereDesLoups() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callFrereSoeurs() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callSorciere() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    callRenard() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

}

class FirstNight extends Night {

    constructor(configuration, gameInfo) {

        super(configuration, gameInfo);

        return this;

    }

    goThrough() {
        return new Promise((resolve, reject) => {

            this.GameConfiguration.channelsHandler.sendMessageToVillage("🌌 La nuit tombe.")
                .then(() => this.callVoleur())
                .then(() => this.callCupidon())
                .then(() => this.callEnfantSauvage())
                .then(() => Promise.all([
                    this.callLoupsGarou(),
                    this.callJoueurDeFlute(),
                    this.callSalvateur()
                ]))
                .then(() => Promise.all([
                    this.callVoyante(),
                    this.callChaman(),
                    this.callInfectPereDesLoups(),
                    this.callFrereSoeurs()
                ]))
                .then(() => Promise.all([
                    this.callSorciere(),
                    this.callRenard()
                ]))
                .then(() => resolve(this.GameConfiguration))
                .catch(err => reject(err));

        });
    }

    callVoleur() {
        return new Promise((resolve, reject) => {

            this.initRole("Voleur")
                .then(voleur => voleur ? voleur.proposeRoleChoice(this.GameConfiguration) : resolve(this))
                .then((voleur) => {

                    if (!voleur.roleChosen) resolve(true);

                    this.GameConfiguration.removePlayer(voleur.member.id);
                    this.GameConfiguration.addPlayer(allRoles[voleur.roleChosen](voleur.member));

                    resolve(this);

                }).catch(err => reject(err));

        });
    }

    callCupidon() {
        return new Promise((resolve, reject) => {

            let cupidons = this.roleMap.get("Cupidon");

            if (!cupidons || cupidons.length < 1) {
                return resolve(true);
            }

            let cupidon = cupidons.shift();

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "💘 **Cupidon** se réveille, il désignera __les amoureux__."
            ).catch(console.error);


            cupidon.getChoice(this.GameConfiguration).then(([id1, id2]) => {

                let choice1 = this.GameConfiguration._players.get(id1);
                let choice2 = this.GameConfiguration._players.get(id2);

                if (!choice1 || !choice2) {
                    reject("Un des deux choix de cupidon est un joueur undefined ou null");
                }

                choice1.amoureux = choice2.member.id;
                choice2.amoureux = choice1.member.id;

                this.GameConfiguration._players.set(choice1.member.id, choice1);
                this.GameConfiguration._players.set(choice2.member.id, choice2);

                console.log(`${choice1.member.displayName} et ${choice2.member.displayName} sont en couple.`);

                Promise.all([
                    cupidon.member.send(`${choice1.member.displayName} et ${choice2.member.displayName} sont en couple.`),
                    choice1.member.send(`Tu es en couple avec ${choice2.member.displayName} 💞`),
                    choice2.member.send(`Tu es en couple avec ${choice1.member.displayName} 💞`),
                ]).then(() => resolve(this.GameConfiguration)).catch(err => reject(err));

            }).catch(err => reject(err));

        });
    }

    callEnfantSauvage() {
        return new Promise((resolve, reject) => {

            let enfantSauvage = this.roleMap.get("EnfantSauvage");

            if (!enfantSauvage || enfantSauvage.length < 1) return resolve(this);

            enfantSauvage = enfantSauvage.shift();

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "L'**Enfant Sauvage** se réveille."
            ).catch(err => LgLogger.warn(err));

            enfantSauvage.askForModel(this.GameConfiguration)
                .then(() => resolve(this))
                .catch(err => reject(err));

        })
    }

}

module.exports = {GameFlow};
