const MessageEmbed = require("discord.js").MessageEmbed;
const BotData = require("../BotData.js");
const lg_var = require('./lg_var.js');
const LgLogger = require("./lg_logger");
const botColor = require("./lg_var").botColor;
const LoupGarouVote = require("./lg_vote").LoupGarouVote;
const DayVote = require("./lg_vote").DayVote;
const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const allRoles = require("./roles/roleFactory").allRoles;
const Wait = require("../functions/wait.js").Wait;
const EveryOneVote = require("./lg_vote.js").EveryOneVote;
const EventEmitter = require('events');
const Vote = require("./lg_vote").DayVote;
const CommunicationHandler = require('./message_sending').CommunicationHandler;
let timeToString = require('../functions/time');
const ReactionHandler = require("../functions/reactionHandler").ReactionHandler;
const Message = require('discord.js').Message;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class GlobalTimer {
    constructor(channel, secInterval) {
        this.embed = CommunicationHandler
            .getLGSampleMsg()
            .addField(
                `⏭`,
                "Réagissez avec ⏭ pour skip l'attente. Tout le monde doit skip pour pouvoir procéder."
            );
        this.timer = null;
        this.message = null;
        this.channel = channel;
        this.secInterval = secInterval ? secInterval : 5;

        this.count = 0;
        this.max = 0;
        this.time = null;
        return this;
    }

    async end() {
        clearInterval(this.timer);
        this.count = 0;
        if (this.message && this.message.deletable) await this.message.delete();
        this.message = null;
        return this;
    }

    setTimer(minutes, title, playerNb) {
        return new Promise((resolve, reject) => {
            if (this.timer) clearInterval(this.timer);

            this.max = playerNb;

            this.time = minutes;

            this.embed.setTitle(`${title} : ${timeToString(minutes)}`);

            let msgPromise = [];

            if (!this.message) {
                msgPromise.push(this.channel.send(this.embed));
            } else {
                msgPromise.push(this.message.edit(this.embed));
            }

            Promise.all(msgPromise)
                .then((msgs) => {
                    this.message = msgs.shift();
                    return new ReactionHandler(this.message, ["⏭"]).addReactions()
                })
                .then(reactionHandler => {

                    reactionHandler.initCollector(
                        (reaction) => {
                            if (reaction.emoji.name === "⏭") {
                                this.count += 1;
                                if (this.count === this.max) {
                                    reactionHandler.stop();
                                }
                            }
                        },
                        () => {
                            if (this.message) {
                                this.message.delete()
                                    .then(() => {
                                        this.end().catch(() => this.message = null);
                                        resolve(this);
                                    }).catch(err => reject(err));
                            } else {
                                this.end().catch(() => this.message = null);
                            }
                        },
                        (reaction) => reaction.count > 1
                    );

                    this.timer = setInterval(() => {
                        this.update().then(isDone => {
                            if (isDone) resolve(this);
                        }).catch(() => true);
                    }, this.secInterval * 1000);

                })
                .catch(err => reject(err));

        });
    }

    async update() {
        this.time = ((this.time * 60) - this.secInterval) / 60;

        if (this.time <= 0) {
            this.end().catch(() => this.message = null);
            return true;
        } else {
            this.embed.setTitle(`${this.embed.title.split(':')[0]}: ${timeToString(this.time)}`);
            await this.message.edit(this.embed);
            return false;
        }
    }

}

class GameFlow extends IGame {

    constructor(client, gameInfo, gameOptions) {

        super(client);

        this.gameInfo = gameInfo;
        this.gameOptions = gameOptions;

        this.GameConfiguration = null;
        this.msg = null;

        this.killer = new EventEmitter();

        // equals 0 if not on pause, and > 0 if on pause
        this.onPause = 0;

        this.turnNb = 1;

        this.gameStats = new MessageEmbed().setColor(botColor).setDescription("Fin de partie");

        this.deadPeople = [];

        return this;

    }

    listenDeaths() {
        setImmediate(() => {
            this.killer.on("death", (deadPlayer) => {

                if (!deadPlayer || typeof deadPlayer !== "object") {
                    LgLogger.warn(`Dead trigger error: deadPlayer equals ${deadPlayer}`, this.gameInfo);
                    return;
                }

                this.onPause += 1;
                LgLogger.info("onpause + 1", this.gameInfo);

                this.deadPeople.push(deadPlayer);

                LgLogger.info("Death triggered", this.gameInfo);

                deadPlayer.alive = false;

                this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.paradis_lg,
                    {VIEW_CHANNEL: true, SEND_MESSAGES: true},
                    [deadPlayer]
                ).then(() => this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.village_lg,
                    {VIEW_CHANNEL: true, SEND_MESSAGES: false},
                    [deadPlayer]
                )).then(() => {

                    if (deadPlayer.team === "LG") {
                        return this.GameConfiguration.channelsHandler.switchPermissions(
                            this.GameConfiguration.channelsHandler.channels.loups_garou_lg,
                            {'VIEW_CHANNEL': false, 'SEND_MESSAGES': false},
                            [deadPlayer]
                        );
                    }

                }).then(() => deadPlayer.die(this.GameConfiguration, this.killer).then((somebodyNew) => {

                    this.GameConfiguration.rolesHandler.removePlayerRole(deadPlayer.member).catch(console.error);
                    this.GameConfiguration.rolesHandler.addDeadRole(deadPlayer.member).catch(console.error);

                    //deadPlayer.member.setVoiceChannel(this.GameConfiguration.channelsHandler._channels.get(
                    //    this.GameConfiguration.channelsHandler.voiceChannels.mort_lg
                    //)).catch(() => true);

                    if (somebodyNew) {
                        somebodyNew.forEach(person => setImmediate(() => this.killer.emit("death", person)));
                    }

                    LgLogger.info("onpause - 1", this.gameInfo);
                    this.onPause -= 1;
                    setImmediate(() => this.killer.emit("death_processed"));

                })).catch(err => {
                    console.error(err);
                    LgLogger.info("onpause - 1", this.gameInfo);
                    this.onPause -= 1;
                    setImmediate(() => this.killer.emit("death_processed"));
                });

            });
        });
    }

    run() {
        return new Promise((resolve, reject) => {

            this.GameConfiguration.globalTimer = new GlobalTimer(this.GameConfiguration.channelsHandler._channels.get(
                this.GameConfiguration.channelsHandler.channels.thiercelieux_lg
            ));

            this.listenDeaths();

            LgLogger.info('Game start', this.gameInfo);

            //this.moveEveryPlayersToVocalChannel().catch(console.error);

            this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg)
                .send(new MessageEmbed().setColor(BotData.BotValues.botColor)
                    .setAuthor("Les Loups-garous de Thiercelieux [v2.3]", lg_var.roles_img.LoupGarou)
                    .setDescription('Développé par Kazuhiro - 和宏 - 龙马 - 카즈히로#1248.\n\n*Thiercelieux est un petit village rural d\'apparence paisible,' +
                        ' mais chaque nuit certains villageois se transforment en loups-garou pour dévorer d\'autres villageois...*\n')
                    .addField("Règles :",
                        'Les joueurs sont divisés en deux camps : les villageois (certains d\'entre eux jouant ' +
                        'un rôle spécial) et les loups-garou. Le but des villageois est de découvrir et d\'éliminer ' +
                        'les loups-garou, et le but des loups-garou est d\'éliminer tous les villageois.\nPour ' +
                        'les amoureux, leur but est de survivre tous les deux jusqu\'à la fin de la partie.')
                    .setFooter("Bienvenue à Thiercelieux, sa campagne paisible, son école charmante, sa population accueillante, ainsi que " +
                        "ses traditions ancestrales et ses mystères inquiétants.", lg_var.roles_img.LoupGarou)
                    .setImage(lg_var.roles_img.LoupGarou))
                .then(() => this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg)
                    .send(new MessageEmbed().setColor(BotData.BotValues.botColor)
                        .addField(
                            "Table ronde",
                            this.GameConfiguration.getTable().map(member => member.displayName).toString().replace(/,+/g, '\n')
                        )
                    )
                ).catch(err => {
                reject(err);
            });


            new FirstDay(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough().then((conf) => {

                this.GameConfiguration = conf;
                return new FirstNight(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

            })
                .then((shouldDie) => this.killPlayers(shouldDie))
                .then(() => this.gameLoop())
                .then((endMsg) => resolve(endMsg))
                .catch(err => reject(err));

        });
    }

    async moveEveryPlayersToVocalChannel() {
        for (let player of this.GameConfiguration.getPlayers().values()) {
            player.member.setVoiceChannel(this.GameConfiguration.channelsHandler._channels.get(
                this.GameConfiguration.channelsHandler.voiceChannels.vocal_lg
            )).catch(() => true);
        }
    }

    async fillGameStats() {
        this.gameStats.setFooter(`Jeu terminé au bout de ${this.gameInfo.getPlayTime()}`);

        this.gameStats.addField(
            "Loups",
            `${this.GameConfiguration.getMemberteams("LG")
                .toString().replace(/,+/g, '\n')}`,
            true
        ).addField(
            "Villageois",
            `${this.GameConfiguration.getMemberteams("VILLAGEOIS")
                .toString().replace(/,+/g, '\n')}`,
            true
        );

        if (this.GameConfiguration.getMemberteams("LOUPBLANC").length > 0) {
            this.gameStats.addField(
                "Loup Blanc",
                `${this.GameConfiguration.getMemberteams("LOUPBLANC")
                    .toString().replace(/,+/g, '\n')}`,
                true
            )
        }

        let winners = this.GameConfiguration.getAlivePlayers().map(player => `__**${player.member.displayName}**__`);

        this.gameStats.setDescription(
            `Vainqueur(s):\n\n${winners.length > 0 ? winners.toString()
                .replace(/,+/g, '\n') : "__**Personne n'a gagné !**__"}`
        );

    }

    /**
     * Problème d'architecture à venir avec l'infect père des loups :
     * Il peut infecter un villageois spécial, qui devient loup garou tout en gardant
     * ses pouvoirs précédents. Architecture à réfléchir pour pouvoir implémenter
     * l'infect père des loups, car la personne infecté aura deux rôles simultanément
     *
     * @returns {Promise<boolean>} resolve true if game ended, false if not.
     */
    async gameEnded() {
        let gameHasEnded = false;

        let gameStatus = {
            lg: 0,
            villageois: 0,
            abominableSectaire: 0,
            ange: 0,
            joueurDeFlute: 0,
            loupBlanc: 0,
            alivePlayers: 0
        };

        let players = this.GameConfiguration.getPlayers();

        for (let player of players.values()) {
            if (player.alive) {
                if (player.team === "LG") gameStatus.lg++;
                if (player.team === "VILLAGEOIS") gameStatus.villageois++;
                if (player.team === "ABOMINABLESECTAIRE") gameStatus.abominableSectaire++;
                if (player.team === "ANGE") gameStatus.ange++;
                if (player.team === "JOUEURDEFLUTE") gameStatus.joueurDeFlute++;
                if (player.team === "LOUPBLANC") gameStatus.loupBlanc++;
                gameStatus.alivePlayers++;
            }
        }

        let alivePlayers = this.GameConfiguration.getAlivePlayers();

        if (gameStatus.alivePlayers === 1) {

            gameHasEnded = true;

            let alivePerson = alivePlayers[0];

            if (alivePerson.team === "LG") {
                this.gameStats.setTitle("Les Loups Garou ont gagnés !");
                this.gameStats.setImage(lg_var.roles_img.LoupGarou);
                this.gameStats.setColor('RED');
            } else if (alivePerson.team === "VILLAGEOIS") {
                this.gameStats.setTitle("Les Villageois ont gagnés !");
                this.gameStats.setImage(lg_var.roles_img.Villageois);
                this.gameStats.setColor('BLUE');
            }

            await this.fillGameStats();

            //todo: handle lone roles like loup blanc, ange and such, AND also Villageois if there is only 1 villager, same for LG team

        } else if (gameStatus.alivePlayers === 2 && alivePlayers[0].amoureux === alivePlayers[1].member.id) {

            gameHasEnded = true;
            this.gameStats.setTitle(`Le couple ${alivePlayers[0].member.displayName} 💗 ${alivePlayers[1].member.displayName} a gagné la partie !`);
            this.gameStats.setImage(lg_var.roles_img.Cupidon);
            this.gameStats.setColor('GOLD');
            await this.fillGameStats();

        } else if (gameStatus.lg === 0 && gameStatus.villageois === 0) {

            gameHasEnded = true;
            this.gameStats.setTitle("Tout le monde est mort !");
            this.gameStats.setColor('RED');
            await this.fillGameStats();

        } else if (gameStatus.lg === 0) {

            gameHasEnded = true;
            this.gameStats.setTitle("Les Villageois ont gagnés !");
            this.gameStats.setColor('BLUE');
            await this.fillGameStats();

        } else if (gameStatus.villageois === 0) {

            //todo: vérifier les rôles alone, ange, loup blanc..

            gameHasEnded = true;
            this.gameStats.setTitle("Les Loups Garou ont gagnés !");
            this.gameStats.setColor('RED');
            await this.fillGameStats();

        }

        LgLogger.info(`Game ended: ${gameHasEnded} | game status: ${JSON.stringify(gameStatus)}`, this.gameInfo);

        return gameHasEnded
    }

    async gameLoop() {

        let shouldDie = [];

        while (await this.gameEnded() === false) {

            await Wait.seconds(3);

            while (this.onPause) {
                await Wait.seconds(1);
            }

            shouldDie = await new Day(this.GameConfiguration, this.gameInfo, this.turnNb, this.deadPeople).goThrough();

            await this.killPlayers(shouldDie);

            if (await this.gameEnded() === true) break;

            this.deadPeople = [];

            await Wait.seconds(2);

            while (this.onPause) {
                await Wait.seconds(1);
            }

            await this.GameConfiguration.channelsHandler.sendMessageToVillage("La nuit va bientôt tomber sur Thiercelieux...");
            await this.GameConfiguration.globalTimer.setTimer(
                23 / 60,
                "Temps avant la tombée de la nuit",
                this.GameConfiguration.getAlivePlayers().length
            );

            shouldDie = await new Night(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

            await this.killPlayers(shouldDie);

            this.turnNb += 1;

            while (this.onPause) {
                await Wait.seconds(1);
            }

        }

        LgLogger.info("Game is over", this.gameInfo);

        return this.gameStats;
    }

    killPlayers(shouldDie) {
        return new Promise((resolve, reject) => {
            shouldDie = [...new Set(shouldDie)];
            shouldDie = shouldDie.filter(element => element !== undefined && element !== null);

            if (shouldDie.length === 0) return resolve(this);

            shouldDie.forEach(person => person ? setImmediate(() => this.killer.emit("death", person)) : null);
            LgLogger.info(`Should die : ${shouldDie.map(p => p ? p.member.displayName : null).toString()}`, this.gameInfo);
            this.killer.on("death_processed", () => {
                if (!this.onPause) {
                    LgLogger.info("resolve kill players", this.gameInfo);
                    resolve(this);
                }
            });
        });
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

    async updateRoleMaps() {
        this.roleMap = this.GameConfiguration.getRoleMap({dead: false, alive: true});
        this.deadRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: false});
        this.allRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: true});
        return this;
    }

}

class Day extends Period {

    constructor(configuration, gameInfo, turnNb, deadPeople) {

        super(configuration, gameInfo, turnNb);

        //configuration.voiceHandler.playDayBGM().catch(console.error);

        this.deadPeople = deadPeople;

        return this;

    }

    goThrough() {
        return new Promise((resolve, reject) => {
            LgLogger.info("Going through day", this.gameInfo);

            this.displayNightOutcome()
                .then(() => this.debateTime())
                .then((outcome) => this.pronounceSentence(outcome))
                .then((victim) => resolve([victim]))
                .catch(err => reject(err));

        })
    }

    async displayNightOutcome() {



        return this;
    }

    async debateTime() {

        let debateDuration = this.GameConfiguration.getAlivePlayers().length / 2; // in minutes

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Le jour se lève sur thiercelieux 🌄`
        );

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Vous disposez de ${timeToString(debateDuration)} pour débattre, et faire un vote`
        );

        await this.GameConfiguration.globalTimer.setTimer(
            debateDuration / 2,
            "Temps avant le début du vote",
            this.GameConfiguration.getAlivePlayers().length
        );

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
            {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
                'ADD_REACTIONS': true
            },
            this.GameConfiguration.getAlivePlayers()
        );

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
            {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: false,
                ADD_REACTIONS: false
            },
            this.GameConfiguration.getDeadPlayers()
        );

        setTimeout(() => {
            this.GameConfiguration.channelsHandler.sendMessageToVillage(`Il reste ${timeToString(debateDuration / 4)} avant la fin du vote`)
        }, (debateDuration / 4) * 60 * 1000);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Votez dans le channel ${this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg).toString()} !`
        );

        return await new DayVote(
            "Qui doit mourir ?",
            this.GameConfiguration,
            (debateDuration / 2) * 60 * 1000,
            this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg),
            this.GameConfiguration.getAlivePlayers().length
        ).excludeDeadPlayers().runVote();
    }

    async pronounceSentence(outcome) {

        let victimId = null;

        if (!outcome || outcome.length === 0) {

            // vote blanc

        } else if (outcome.length === 1) {

            victimId = outcome[0]

        } else if (outcome.length > 1) {

            // more than one victim voted, the capitaine must make a decision
            // if no capitaine, random victim
            // if capitaine refuse to make a decision, pick a random victim

            let capitaine = this.GameConfiguration.Capitaine;

            if (capitaine && capitaine.alive) {

                await this.GameConfiguration.channelsHandler.sendMessageToVillage("Le vote est nul, le Capitaine va devoir trancher");

                victimId = await new Promise((resolve, reject) => {
                    capitaine.getDMChannel()
                        .then(dmChannel => new EveryOneVote(
                            "Qui doit mourir ?",
                            this.GameConfiguration,
                            30000,
                            dmChannel,
                            1
                        ).excludeDeadPlayers().runVote(
                            this.GameConfiguration.getAlivePlayers().filter(p => !outcome.includes(p.member.id))
                        ))
                        .then(capitaineDecision => {
                            if (!capitaineDecision || capitaineDecision.length === 0) {
                                resolve(get_random_in_array(outcome));
                            } else {
                                resolve(capitaineDecision[0]);
                            }
                        })
                        .catch(err => reject(err));
                });

            } else {

                victimId = get_random_in_array(outcome);

            }

        }

        if (!victimId) {

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Le village n'a pas souhaité voter`
            );

            return null;

        } else {
            let victim = this.GameConfiguration.getPlayerById(victimId);

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Le village a souhaité la mort de **${victim.member.displayName}**, étant ${victim.role}`
            );

            return victim;
        }

    }

}

class FirstDay extends Period {

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

        //configuration.voiceHandler.playFirstDayBGM().catch(console.error);

        return this;
    }

    goThrough() {
        return new Promise((resolve, reject) => {

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "🌄 Le jour se lève à Thiercelieux." +
                " Quand la neige éternelle ornera les montagnes, le capitaine devra être élu."
            ).then(() => this.GameConfiguration.globalTimer.setTimer(
                1,
                "Temps avant le vote du capitaine",
                this.GameConfiguration.getAlivePlayers().length
            ))
                .then(() => this.capitaineElection())
                .then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage("⛰ La nuit va bientôt tomber sur Thiercelieux."))
                .then(() => this.GameConfiguration.globalTimer.setTimer(
                    0.5,
                    "Temps avant la tombée de la nuit",
                    this.GameConfiguration.getAlivePlayers().length
                ))
                .then(() => resolve(this.GameConfiguration))
                .catch(err => reject(err));

        });
    }

    capitaineElection() {
        return new Promise((resolve, reject) => {

            LgLogger.info('Begining capitaine election.', this.gameInfo);

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "🏔 Les villageois se réunissent afin d'élir leur capitaine\n" +
                "C'est l'heure du vote !"
            ).then(() => {

                return this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
                    {
                        'VIEW_CHANNEL': true,
                        'SEND_MESSAGES': true,
                        'ADD_REACTIONS': true
                    },
                    Array.from(this.GameConfiguration.getPlayers().values())
                );

            }).then(() => {

                LgLogger.info('Permissions switch, init referendum.', this.gameInfo);

                this.GameConfiguration.channelsHandler.sendMessageToVillage(
                    `Votez dans le channel ${this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg).toString()} !`
                ).catch(console.error);

                return new EveryOneVote(
                    "Qui voulez-vous élir comme capitaine ?",
                    this.GameConfiguration,
                    120000,
                    this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg),
                    this.GameConfiguration._players.size
                ).runVote();

            }).then((outcome) => {

                LgLogger.info("Capitaine outcome : " + outcome, this.gameInfo);

                if (outcome.length === 0) {
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "Le village n'a pas voulu élire de Capitaine."
                    ).catch(console.error);

                    this.gameInfo.addToHistory(`Le village n'a pas élu de Capitaine du village.`);

                } else if (outcome.length === 1) {
                    let id = outcome.shift();
                    let capitaineElected = this.GameConfiguration._players.get(id);

                    this.gameInfo.addToHistory(`Le village a élu ${capitaineElected.member.displayName} Capitaine du village.`);

                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        `${capitaineElected.member.displayName} a été élu Capitaine de Thiercelieux !`
                    ).catch(console.error);
                    capitaineElected.capitaine = true;
                    this.GameConfiguration._players.set(id, capitaineElected);
                    this.GameConfiguration.capitaine = capitaineElected;
                } else if (outcome.length > 1) {

                    this.gameInfo.addToHistory(`Le village n'a pas élu de Capitaine du village.`);

                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "Le village n'a pas pu élire de Capitaine, les votes étant trop serrés."
                    ).catch(console.error);
                }

                return this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
                    {
                        'VIEW_CHANNEL': true,
                        'SEND_MESSAGES': false,
                        'ADD_REACTIONS': true
                    },
                    Array.from(this.GameConfiguration.getPlayers().values())
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

        //configuration.voiceHandler.playNightBGM().catch(console.error);

        this.LGTarget = null;
        this.shouldDieTonight = new Map();

        configuration.channelsHandler.switchPermissions(
            configuration.channelsHandler.channels.village_lg,
            {VIEW_CHANNEL: true, SEND_MESSAGES: false},
            configuration.getAlivePlayers()
        ).catch(console.error);

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
                `${prefix}**${realName ? realName : roleName}** se réveille.`,
                undefined,
                lg_var.roles_img[roleName]
            ).catch(err => LgLogger.warn(err, this.gameInfo));

            resolve(role);
        });
    }

    async initPetiteFilleListening() {
        let petitesFilles = this.roleMap.get("PetiteFille");

        if (!petitesFilles || petitesFilles.length < 1 || !petitesFilles[0].alive) {
            try {
                if (this.GameConfiguration.loupGarouMsgCollector) {
                    this.GameConfiguration.loupGarouMsgCollector.stop();
                }
            } catch (e) {
                console.error(e);
            }
            return;
        }

        LgLogger.info("Début de l'écoute petite fille", this.gameInfo);

        let petiteFille = petitesFilles[0];

        let dmChannel = await petiteFille.getDMChannel();

        await dmChannel.send("Début de l'écoute des loups garous");

        this.GameConfiguration.loupGarouMsgCollector = this.GameConfiguration.getLGChannel().createMessageCollector(() => true);

        this.GameConfiguration.loupGarouMsgCollector.on("collect", msg => {
            dmChannel.send(msg.cleanContent).catch(() => true);
        });

    }


    goThrough() {
        return new Promise((resolve, reject) => {

            LgLogger.info("Going through night", this.gameInfo);
            this.shouldDieTonight.clear();
            this.GameConfiguration.channelsHandler.sendMessageToVillage("🌌 La nuit tombe.")
                .then(() => Promise.all([
                    this.callLoupsGarou(),
                    this.callJoueurDeFlute(),
                    this.callSalvateur()
                ]))
                .then(() => this.updateRoleMaps())
                .then(() => Promise.all([
                    this.callVoyante(),
                    this.callChaman(),
                    this.callInfectPereDesLoups(),
                    this.callFrereSoeurs()
                ]))
                .then(() => this.updateRoleMaps())
                .then(() => Promise.all([
                    this.callSorciere(),
                    this.callRenard()
                ]))
                .then(() => this.updateRoleMaps())
                .then(() => this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.village_lg,
                    {VIEW_CHANNEL: true, SEND_MESSAGES: true},
                    this.GameConfiguration.getAlivePlayers()
                ))
                .then(() => resolve(Array.from(this.shouldDieTonight.values())))
                .catch(err => reject(err));

        });
    }

    callLoupsGarou() {
        return new Promise((resolve, reject) => {

            if (this.turnNb === 1) {
                this.GameConfiguration.getLGChannel().send("Prenez garde à la petite fille...").catch(console.error);
            }
            this.initPetiteFilleListening().catch(console.error);

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Les **Loups Garous** se réveillent 🐺`, undefined, lg_var.roles_img.LoupGarou
            ).then(() => new LoupGarouVote(
                    "Veuillez choisir votre proie.",
                    this.GameConfiguration,
                    60000,
                    this.GameConfiguration.getLGChannel()
                ).excludeDeadPlayers().runVote(this.GameConfiguration.getLGIds())).then(outcome => {

                if (!outcome || outcome.length === 0) {
                    this.shouldDieTonight.set("LGTarget", get_random_in_array(this.GameConfiguration.getVillageois(false)));
                } else {
                    this.shouldDieTonight.set("LGTarget", this.GameConfiguration.getPlayerById(get_random_in_array(outcome)));
                }

                return this.GameConfiguration.getLGChannel().send(
                    `Votre choix est de dévorer ${this.shouldDieTonight.get("LGTarget").member.displayName}`
                );

            }).then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Les **Loups Garous** se rendorment.`, undefined, lg_var.roles_img.LoupGarou
            )).then(() => resolve(this)).catch(err => reject(err));

        });
    }

    async callJoueurDeFlute() {
        return this;
    }

    async callSalvateur() {

        let salvateur = await this.initRole("Salvateur", "Le ");

        if (!salvateur) return this;

        await salvateur.processRole(this.GameConfiguration);

        return this;
    }

    async callVoyante() {

        let voyante = await this.initRole("Voyante", "La ");

        if (!voyante) {
            return this;
        }

        //await this.GameConfiguration.voiceHandler.announceRole("Voyante", true);

        await voyante.processRole(this.GameConfiguration);
        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "La **Voyante** se rendort.", undefined, lg_var.roles_img.Voyante
        );

        return this;
    }

    async callChaman() {
        return this;
    }

    async callInfectPereDesLoups() {
        return this;
    }

    async callFrereSoeurs() {
        return this;
    }

    async callSorciere() {

        let sorciere = await this.initRole("Sorciere", "La ", "Sorcière");

        if (!sorciere) return this;

        //await this.GameConfiguration.voiceHandler.announceRole("Sorciere", true);

        await sorciere.processRole(this.GameConfiguration, this.shouldDieTonight.get("LGTarget"));

        if (sorciere.savedLgTarget || sorciere.targetIsSavedBySalva) {
            this.shouldDieTonight.set("LGTarget", null);
        }

        this.shouldDieTonight.set("SorciereTarget", sorciere.target);

        if (sorciere.target) {
            LgLogger.info(`Sorciere target: ${sorciere.target.member.displayName}`, this.gameInfo);
            LgLogger.info(`Sorciere saved: ${sorciere.savedLgTarget}`, this.gameInfo);
            LgLogger.info(`Sorciere potions: vie[${sorciere.potions.vie}] poison[${sorciere.potions.poison}]`, this.gameInfo);
        }

        sorciere.savedLgTarget = false;
        sorciere.targetIsSavedBySalva = false;

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "La **Sorcière** se rendort", undefined, lg_var.roles_img.Sorciere
        );

        return this;
    }

    async callRenard() {
        return this;
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
                .then(() => this.updateRoleMaps())
                .then(() => this.callCupidon())
                .then(() => this.updateRoleMaps())
                .then(() => this.callEnfantSauvage())
                .then(() => this.updateRoleMaps())
                .then(() => Promise.all([
                    this.callLoupsGarou(),
                    this.callJoueurDeFlute(),
                    this.callSalvateur()
                ]))
                .then(() => this.updateRoleMaps())
                .then(() => Promise.all([
                    this.callVoyante(),
                    this.callChaman(),
                    this.callInfectPereDesLoups(),
                    this.callFrereSoeurs()
                ]))
                .then(() => this.updateRoleMaps())
                .then(() => Promise.all([
                    this.callSorciere(),
                    this.callRenard()
                ]))
                .then(() => this.updateRoleMaps())
                .then(() => this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.village_lg,
                    {VIEW_CHANNEL: true, SEND_MESSAGES: true},
                    this.GameConfiguration.getAlivePlayers()
                ))
                .then(() => resolve(Array.from(this.shouldDieTonight.values())))
                .catch(err => {
                    reject(err);
                });

        });
    }

    async callVoleur() {
        let newPlayer = null;

        let voleur = await this.initRole("Voleur", "Le ");

        if (!voleur) return this;

        //await this.GameConfiguration.voiceHandler.announceRole("Voleur", true);

        await voleur.proposeRoleChoice(this.GameConfiguration);

        if (!voleur.roleChosen) {
            this.gameInfo.addToHistory(`[Voleur] ${voleur.member.displayName}: a choisi de garder son rôle`);
            return this;
        }

        this.gameInfo.addToHistory(`[Voleur] ${voleur.member.displayName}: a choisi de prendre le rôle ${voleur.roleChosen}`);

        let voleurId = voleur.member.id;

        this.GameConfiguration.removePlayer(voleurId);
        this.GameConfiguration.addPlayer(allRoles[voleur.roleChosen](voleur.member));

        newPlayer = this.GameConfiguration.getPlayerById(voleurId);
        let promises = [];

        Object.keys(newPlayer.permission).forEach((channelName) => {

            let channel = this.GameConfiguration.channelsHandler._channels.get(
                this.GameConfiguration.channelsHandler.channels[channelName]
            );

            if (channel) {
                promises.push(
                    channel.createOverwrite(
                        newPlayer.member,
                        newPlayer.permission[channelName]
                    )
                );
            }

        });

        await Promise.all(promises);

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.village_lg,
            {VIEW_CHANNEL: true, SEND_MESSAGES: false},
            [newPlayer]
        );

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "**Le Voleur** se rendort.", undefined, lg_var.roles_img.Voleur
        );

        return this;
    }

    callCupidon() {
        return new Promise((resolve, reject) => {

            let cupidons = this.roleMap.get("Cupidon");

            if (!cupidons || cupidons.length < 1) {
                return resolve(true);
            }

            let cupidon = cupidons[0];

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "💘 **Cupidon** se réveille, il désignera __les amoureux__.", undefined,
                lg_var.roles_img.Cupidon
            ).catch(console.error);

                cupidon.getChoice(this.GameConfiguration)
                .then(([id1, id2]) => {

                    if (!id1 || !id2) {
                        this.GameConfiguration.channelsHandler.sendMessageToVillage(
                            "💘 **Cupidon** se rendort.", undefined, lg_var.roles_img.Cupidon
                        ).catch(console.error);
                        resolve(this.GameConfiguration);
                        return;
                    }

                    let choice1 = this.GameConfiguration._players.get(id1);
                    let choice2 = this.GameConfiguration._players.get(id2);

                    if (!choice1 || !choice2) {
                        LgLogger.info("Cupidon n'a pas fait son choix", this.gameInfo);

                        let players = Array.from(this.GameConfiguration._players.values());
                        let randomChoice = get_random_in_array(players);
                        players.splice(players.indexOf(randomChoice));

                        if (!choice1) choice1 = randomChoice;
                        if (!choice2) choice2 = get_random_in_array(players);
                    }

                    if (!choice2 || !choice1) {
                        this.GameConfiguration.channelsHandler.sendMessageToVillage(
                            "💘 **Cupidon** se rendort.", undefined, lg_var.roles_img.Cupidon
                        ).catch(console.error);
                        resolve(this.GameConfiguration);
                        return;
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
                    ]).then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "💘 **Cupidon** se rendort.", undefined, lg_var.roles_img.Cupidon
                    )).then(() => resolve(this.GameConfiguration)).catch(err => reject(err));

                }).catch(err => reject(err));

        });
    }

    callEnfantSauvage() {
        return new Promise((resolve, reject) => {

            let enfantSauvage = this.roleMap.get("EnfantSauvage");

            if (!enfantSauvage || enfantSauvage.length < 1) return resolve(this);

            enfantSauvage = enfantSauvage[0];

            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "L'**Enfant Sauvage** se réveille.", undefined, lg_var.roles_img.EnfantSauvage
            ).catch(err => LgLogger.warn(err, this.gameInfo));

            enfantSauvage.askForModel(this.GameConfiguration)
                .then(() => this.GameConfiguration.channelsHandler.sendMessageToVillage(
                    "L'**Enfant Sauvage** se rendort.", undefined, lg_var.roles_img.EnfantSauvage
                ))
                .then(() => resolve(this))
                .catch(err => reject(err));

        })
    }

}

module.exports = {GameFlow};
