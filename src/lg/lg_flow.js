const RichEmbed = require("discord.js").RichEmbed;
const BotData = require("../BotData.js");
const lg_var = require('./lg_var.js');
const LgLogger = require("./lg_logger");
const botColor = require("./lg_var").botColor;
const LoupGarouVote = require("./lg_vote").LoupGarouVote;
const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const allRoles = require("./roles/roleFactory").allRoles;
const Wait = require("../functions/wait.js").Wait;
const EveryOneVote = require("./lg_vote.js").EveryOneVote;
const EventEmitter = require('events').EventEmitter;

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

        this.killer = new EventEmitter();

        this.onPause = false;

        this.turnNb = 1;

        this.gameStats = new RichEmbed().setColor(botColor).setDescription("Fin de partie");

        return this;

    }

    listenDeaths() {
        this.killer.on("death", (deadPlayer) => {

            this.onPause = true;

            deadPlayer.alive = false;
            deadPlayer.die(this.GameConfiguration, this.killer).then((somebodyNew) => {

                this.GameConfiguration.rolesHandler.removePlayerRole(deadPlayer.member).catch(console.error);
                this.GameConfiguration.rolesHandler.addDeadRole(deadPlayer.member).catch(console.error);

                if (somebodyNew) {
                    somebodyNew.forEach(person => this.killer.emit("death", person));
                } else {
                    this.onPause = false;
                }

            }).catch(err => {
                console.error(err);
                this.onPause = false;
            });

        })
    }

    run() {
        return new Promise((resolve, reject) => {

            this.listenDeaths();

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
                    .setImage(lg_var.roles_img.LoupGarou)).catch(err => {
                reject(err);
            });


            new FirstDay(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough().then((conf) => {

                this.GameConfiguration = conf;
                return new FirstNight(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

            }).then((conf) => {

                this.GameConfiguration = conf;
                return this.gameLoop();

            }).then(() => {
                resolve(true);
            }).catch(err => reject(err));

        });
    }

    printGameStats() {
        return new Promise((resolve, reject) => {

            this.gameStats.setFooter(`Jeu terminé au bout de ${this.gameInfo.getPlayTime()}`);

            this.gameStats.addField(
                "Loups",
                `${this.GameConfiguration.getMemberteamNames("LG").toString().replace(',', ', ')}`,
                true
            ).addField(
                "Villageois",
                `${this.GameConfiguration.getMemberteamNames("VILLAGEOIS").toString().replace(',', ', ')}`,
                true
            );

            if (this.GameConfiguration.getMemberteamNames("LOUPBLANC")) {
                this.gameStats.addField(
                    "Loup Blanc",
                    `${this.GameConfiguration.getMemberteamNames("LOUPBLANC").toString().replace(',', ', ')}`,
                    true
                )
            }

        });
    }

    /**
     * todo: return true if game ended, false if not.
     * @returns {Promise<any>}
     */
    gameEnded() {
        return new Promise((resolve, reject) => {
            let players = this.GameConfiguration.getPlayers();
            let lg = 0;
            let villageois = 0;

            let promises = [];

            for (let player of players.values()) {
                if (player.alive) {
                    if (player.team === "LG") lg++;
                    if (player.team === "VILLAGEOIS") villageois++;
                }
            }

            if (lg === 0 && villageois === 0) {
                promises.push(this.printGameStats(this.gameStats));
            } else if (lg === 0) {
                this.gameStats.setTitle("Les Villageois ont gagnés !");
                this.gameStats.setColor('BLUE');
                promises.push(this.printGameStats(this.gameStats));
            } else if (villageois === 0) {
                this.gameStats.setTitle("Les Loups Garou ont gagnés !");
                this.gameStats.setColor('RED');
                promises.push(this.printGameStats(this.gameStats));
            }

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    async gameLoop() {

        let end;
        do {

            await Wait.seconds(4);

            while (this.onPause) {
                await Wait.seconds(1);
            }

            end = await new Day(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

            if (end) break;

            end = await new Night(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

            this.turnNb += 1;

        } while (end !== true && this.turnNb < 5); //todo: remove turnNb < 5

        await Wait.seconds(4);

        while (this.onPause) {
            await Wait.seconds(1);
        }

        LgLogger.info("Game is over", this.gameInfo);

        return this;
    }

}

class Period {

    constructor(configuration, gameInfo, turnNb) {

        this.GameConfiguration = configuration;

        this.gameInfo = gameInfo;

        this.turnNb = turnNb;

        this.roleMap = this.GameConfiguration.getRoleMap({dead: false, alive: true});
        this.deadRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: false});
        this.allRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: true});

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

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

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

                return new EveryOneVote(
                    "Qui voulez-vous élir comme maire ?",
                    this.GameConfiguration,
                    120000,
                    this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg),
                    this.GameConfiguration._players.size
                ).runVote();

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

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

        this.LGTarget = null;
        this.SorciereTarget = null;

        return this;

    }

    initRole(roleName, prefix, realName) {
        return new Promise((resolve, reject) => {
            let roles = this.roleMap.get(roleName);

            if (!roles || roles.length < 1) {
                return resolve(false);
            }

            let role = roles[0];

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `${prefix}**${realName ? realName : roleName}** se réveille.`
            ).catch(err => LgLogger.warn(err, this.gameInfo));

            resolve(role);
        });
    }

    initPetiteFilleListening() {
        let petitesFilles = this.roleMap.get("PetiteFille");

        if (!petitesFilles || petitesFilles.length < 1) {
            return;
        }

        let petiteFille = petitesFilles[0];

        petiteFille.getDMChannel().then(dmChannel => {

            dmChannel.send("Début de l'écoute des loups garous").catch(console.error);

            this.GameConfiguration.loupGarouMsgCollector = this.GameConfiguration.getLGChannel().createMessageCollector(() => true);

            this.GameConfiguration.loupGarouMsgCollector.on("collect", msg => {
                dmChannel.send(msg).catch(console.error);
            });

        }).catch(err => {
            LgLogger.error(err);
        })
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
                .then(() => this.computeDeaths())
                .then(() => resolve(false))
                .catch(err => reject(err));

        });
    }

    computeDeaths() {
        return new Promise((resolve, reject) => {

        });
    }

    callLoupsGarou() {
        return new Promise((resolve, reject) => {

            if (this.turnNb === 1) {
                this.GameConfiguration.getLGChannel().send("Prenez garde à la petite fille...").catch(console.error);
                this.initPetiteFilleListening();
            }

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Les **Loups Garous** se réveillent 🐺`
            ).then(() => new LoupGarouVote(
                "Veuillez choisir votre proie.",
                this.GameConfiguration,
                60000,
                this.GameConfiguration.getLGChannel()
            ).runVote(this.GameConfiguration.getLGIds())).then(outcome => {

                if (!outcome || outcome.length === 0) {
                    this.LGTarget = get_random_in_array(this.GameConfiguration.getVillageois(false));
                } else {
                    this.LGTarget = this.GameConfiguration.getPlayerById(get_random_in_array(outcome));
                }

                return this.GameConfiguration.getLGChannel().send(
                    `Votre choix est de dévorer ${this.LGTarget.member.displayName}`
                );

            }).then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Les **Loups Garous** se rendorment.`
            )).then(() => resolve(this)).catch(err => reject(err));

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

            this.initRole("Voyante", "La ")
                .then(voyante => {

                    if (!voyante) return resolve(this);

                    return voyante.processRole(this.GameConfiguration);

                }).then(() => {
                return this.GameConfiguration.channelsHandler.sendMessageToVillage(
                    "La **Voyante** se rendort."
                );
            }).then(() => resolve(this)).catch(err => reject(err));

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
            this.initRole("Sorciere", "La ", "Sorcière")
                .then(sorciere => sorciere.processRole(this.GameConfiguration, this.LGTarget))
                .then(sorciere => {

                    if (sorciere.savedLgTarget) {
                        this.LGTarget = null;
                    }

                    this.SorciereTarget = sorciere.target;

                    LgLogger.info(`Sorciere target: ${sorciere.target.member.displayName}`, this.gameInfo);
                    LgLogger.info(`Sorciere saved: ${sorciere.savedLgTarget}`, this.gameInfo);
                    LgLogger.info(`Sorciere potions: vie[${sorciere.potions.vie}] poison[${sorciere.potions.poison}]`, this.gameInfo);

                    sorciere.savedLgTarget = false;

                })
                .then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage(
                    "La **Sorcière** se rendort"
                ))
                .then(() => resolve(this)).catch(err => reject(err));
        });
    }

    callRenard() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

}

class FirstNight extends Night {

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

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
                .catch(err => {
                    reject(err);
                });

        });
    }

    callVoleur() {
        return new Promise((resolve, reject) => {

            this.initRole("Voleur", "Le ")
                .then(voleur => voleur ? voleur.proposeRoleChoice(this.GameConfiguration) : resolve(this))
                .then((voleur) => {

                    if (!voleur.roleChosen) resolve(true);

                    this.GameConfiguration.removePlayer(voleur.member.id);
                    this.GameConfiguration.addPlayer(allRoles[voleur.roleChosen](voleur.member));

                    return this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "**Le Voleur** se rendort."
                    );

                }).then(() => resolve(this)).catch(err => reject(err));

        });
    }

    callCupidon() {
        return new Promise((resolve, reject) => {

            let cupidons = this.roleMap.get("Cupidon");

            if (!cupidons || cupidons.length < 1) {
                return resolve(true);
            }

            let cupidon = cupidons[0];

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "💘 **Cupidon** se réveille, il désignera __les amoureux__."
            ).catch(console.error);


            cupidon.getChoice(this.GameConfiguration).then(([id1, id2]) => {

                let choice1 = this.GameConfiguration._players.get(id1);
                let choice2 = this.GameConfiguration._players.get(id2);

                if (!choice1 || !choice2) {
                    LgLogger.info("Cupidon n'a pas fait son choix", this.gameInfo);

                    let players = Array.from(this.GameConfiguration._players.values());
                    let randomChoice = get_random_in_array(players);
                    players.splice(players.indexOf(randomChoice));

                    choice1 = randomChoice;
                    choice2 = get_random_in_array(players);
                }

                choice1.amoureux = choice2.member.id;
                choice2.amoureux = choice1.member.id;

                this.GameConfiguration._players.set(choice1.member.id, choice1);
                this.GameConfiguration._players.set(choice2.member.id, choice2);

                LgLogger.info(`${choice1.member.displayName} et ${choice2.member.displayName} sont en couple.`, this.gameInfo);

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

            enfantSauvage = enfantSauvage[0];

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "L'**Enfant Sauvage** se réveille."
            ).catch(err => LgLogger.warn(err, this.gameInfo));

            enfantSauvage.askForModel(this.GameConfiguration)
                .then(() => resolve(this))
                .catch(err => reject(err));

        })
    }

}

module.exports = {GameFlow};
