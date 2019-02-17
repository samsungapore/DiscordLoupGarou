const BotData = require("../../BotData.js");
const lg_var = require("../lg_var");
const LGGame = require("./roleFactory");
const LgLogger = require("../lg_logger");
const get_random_in_array = require("../../functions/parsing_functions").get_random_in_array;
const shuffle_array = require("../../functions/parsing_functions").shuffle_array;
const ReactionHandler = require("../../functions/reactionHandler").ReactionHandler;
const RichEmbed = require("discord.js").RichEmbed;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class RolesHandler extends IGame {

    constructor(client, guild, gameInfo) {
        super(client);

        this.gameInfo = gameInfo;

        this.guild = guild;

        this.roles = {
            JoueurLG: {
                color: 'BLUE',
                object: null
            },
            MortLG: {
                color: 'RED',
                object: null
            },
            MastermindLG: {
                color: 'WHITE',
                object: null
            }
        };

        this.factory = {
            LoupGarou: LGGame.Create.loupGarou,
            Voyante: LGGame.Create.voyante,
            Voleur: LGGame.Create.voleur,
            Chasseur: LGGame.Create.chasseur,
            Cupidon: LGGame.Create.cupidon,
            Sorciere: LGGame.Create.sorciere,
            PetiteFille: LGGame.Create.petiteFille,
            Villageois: LGGame.Create.villageois,
            Salvateur: LGGame.Create.salvateur,
            IdiotDuVillage: LGGame.Create.idiotDuVillage,
            BoucEmissaire: LGGame.Create.boucEmissaire,
            JoueurDeFlute: LGGame.Create.joueurDeFlute,
            EnfantSauvage: LGGame.Create.enfantSauvage,
            /*Chevalier: LGGame.Create.chevalier,
            Ange: LGGame.Create.ange,
            InfectPereDesLoups: LGGame.Create.infectPereDesLoups,
            Soeur: LGGame.Create.soeur,
            Renard: LGGame.Create.renard,
            ServanteDevouee: LGGame.Create.servanteDevouee,
            Frere: LGGame.Create.frere,
            MontreurOurs: LGGame.Create.montreurOurs,
            Comedien: LGGame.Create.comedien,
            AbominableSectaire: LGGame.Create.abominableSectaire,
            ChienLoup: LGGame.Create.chienLoup,
            VillageoisVillageois: LGGame.Create.villageoisVillageois,
            Corbeau: LGGame.Create.corbeau,
            GrandMechantLoup: LGGame.Create.grandMechantLoup,
            Ancien: LGGame.Create.ancien,
            JugeBegue: LGGame.Create.jugeBegue,*/
        };

        this.role_conf = [
            {
                LoupGarou: 1,
            },
            // Thiercelieux
            {
                Voyante: 1,
                Voleur: 1,
                Chasseur: 1,
                Cupidon: 1,
                Sorciere: 1,
            },
            {
                PetiteFille: 1,
                LoupGarou: 1
            },
            // Nouvelle lune
            {
                Villageois: 1,
                LoupGarou: 1,
                Salvateur: 1,
                IdiotDuVillage: 1,
                BoucEmissaire: 1,
                JoueurDeFlute: 1
            },
            {
                Villageois: 1,
                EnfantSauvage: 1,
                Chevalier: 1,
                Ange: 1,
                InfectPereDesLoups: 1,
                Soeur: 2, // todo: si une carte soeur est donnée, il faut donner la deuxième. Si impossible de donner la deuxième, donner un autre rôle.
                Renard: 1,
                ServanteDevouee: 1,
                Frere: 3, // todo: si une carte soeur est donnée, il faut donner les autres. Si impossible de les donner, donner un autre rôle.
                MontreurOurs: 1,
                Comedien: 1,
                AbominableSectaire: 1,
                ChienLoup: 1,
                VillageoisVillageois: 1,
                Corbeau: 1
            },
            {
                GrandMechantLoup: 1,
                Ancien: 1,
                JugeBegue: 1,
            },
            {
                Villageois: Number.MAX_SAFE_INTEGER
            }
        ];

        this.thiercelieux = [
            this.role_conf[0], this.role_conf[1], this.role_conf[2], this.role_conf[6]
        ];

        this.nouvelleLune = [
            this.role_conf[0], this.role_conf[1], this.role_conf[3], this.role_conf[6]
        ];

        this.allExtension = this.thiercelieux;

        this.gameType = this.thiercelieux;

        return this;
    }

    deleteOlderRoles() {
        return new Promise((resolve, reject) => {

            let promises = [];

            this.guild.roles.array().forEach(role => {

                Object.keys(this.roles).forEach(roleName => {
                    if (role.name === roleName) {
                        promises.push(role.delete());
                    }
                });

            });

            Promise.all(promises).then(() => resolve(true)).catch(err => reject(err));

        });
    }

    createRoles() {
        return new Promise((resolve, reject) => {

            this.deleteOlderRoles().then(() => {

                let rolePromises = [];

                Object.keys(this.roles).forEach(role_name => {

                    // creating the role 'role_name'
                    rolePromises.push(this.guild.createRole({
                        name: role_name,
                        color: this.roles[role_name].color,
                        hoist: true
                    }));

                });

                return Promise.all(rolePromises);

            }).then((roleArray) => {

                roleArray.forEach(role => {
                    this.roles[role.name].object = role;
                });

                resolve(true);

            }).catch(err => reject(err));

        });
    }

    deleteRoles() {
        return new Promise((resolve, reject) => {

            let promises = [];

            Object.keys(this.roles).forEach(roleName => {
                promises.push(this.roles[roleName].object.delete());
            });

            Promise.all(promises).then(() => resolve(true)).catch(() => resolve(true));

        });
    }

    /**
     * returns promise
     * @param guildMember
     * @returns {Promise<GuildMember>}
     */
    addPlayerRole(guildMember) {
        return guildMember.addRole(this.roles.JoueurLG.object);
    }

    addDeadRole(guildMember) {
        return guildMember.addRole(this.roles.MortLG.object);
    }

    removePlayerRole(guildMember) {
        return guildMember.removeRole(this.roles.JoueurLG.object);
    }

    removeDeadRole(guildMember) {
        return guildMember.removeRole(this.roles.MortLG.object);
    }

    /**
     * Returns no promise
     * @param guildMember
     */
    removeRoles(guildMember) {
        guildMember.removeRole(this.roles.JoueurLG.object).catch(() => true);
        guildMember.removeRole(this.roles.MortLG.object).catch(() => true);
    }

    assignRoles(configuration) {
        return new Promise((resolve, reject) => {

            let participantArray = shuffle_array(Array.from(configuration.getParticipants().keys()));
            let promises = [];

            participantArray.forEach(playerId => {
                promises.push(this.assignRole(playerId, configuration));
            });

            Promise.all(promises).then((players) => {

                players.forEach(player => {
                    configuration.addPlayer(player);
                });

                resolve(configuration);

            }).catch(err => reject(err))

        });
    }

    getAdditionnalRoles(number) {
        return new Promise((resolve, reject) => {
            const lg_functions = require('../lg_functions.js');

            let additionalRoles = [];

            while (number > 0 && this.confHasSpace()) {

                this.gameType.forEach(role_block => {
                    if (!this.roleComplete(role_block)) {

                        let role_object = RolesHandler.cleanRoleArray(role_block);
                        let role_array = Object.keys(role_object);

                        additionalRoles.push(role_array[lg_functions.get_random_index(role_array)]);

                        number -= 1;
                        if (number === 0) {
                            resolve(additionalRoles);
                        }

                    }
                });

            }

            if (!this.confHasSpace()) LgLogger.warn("Conf is completely empty", this.gameInfo);

            resolve(additionalRoles);
        });
    }

    assignRole(id, configuration) {
        return new Promise((resolve, reject) => {

            let found = false;

            for (let i = 0; i < this.gameType.length; i++) {

                if (!this.roleComplete(this.gameType[i])) {
                    this.setRole(configuration.getParticipants().get(id), i)
                        .then((player) => resolve(player))
                        .catch(err => reject(err));
                    found = true;
                    break;
                }

            }

            if (found === false) {
                reject(`No role found for ${configuration.getParticipants().get(id).displayName}`)
            }

        });
    }

    roleComplete(roleVar) {
        let complete = true;

        Object.keys(roleVar).forEach(role => {

            if (roleVar[role] !== 0) {
                complete = false;
            }

        });

        return complete;
    }

    setRole(guildMember, roleVarIndex) {
        return new Promise((resolve, reject) => {

            let rolesNames = Object.keys(RolesHandler.cleanRoleArray(this.gameType[roleVarIndex]));

            if (rolesNames.length === 0) {
                reject("Empty rolesNames variable");
            }

            if (!guildMember) {
                reject("GuildMember not found");
            }

            let randomRoleName = get_random_in_array(rolesNames);

            this.gameType[roleVarIndex][randomRoleName] -= 1;

            resolve(this.factory[randomRoleName](guildMember));

        });
    }

    static cleanRoleArray(roleArray) {
        let cleaned = Object();
        Object.keys(roleArray).forEach(role => {

            if (roleArray[role] !== 0)
                cleaned[role] = roleArray[role];

        });
        return cleaned;
    }

    sendRolesToPlayers(configuration) {
        return new Promise((resolve, reject) => {

            let promises = [];

            LgLogger.info(`Number of players : ${configuration.getPlayers().size}`, this.gameInfo);
            for (let player of configuration.getPlayers().values()) {
                promises.push(player.member.send(lg_var.roles_desc[player.role]));
            }

            Promise.all(promises).then((messagesSend) => {
                LgLogger.info(`Sent ${messagesSend.length} roles.`, this.gameInfo);
                resolve(true);
            }).catch(err => resolve(err)); //todo: change to reject

        });
    }

    confHasSpace() {

        let found = false;

        for (let i = 0; i < this.gameType.length; i++) {

            if (!this.roleComplete(this.gameType[i])) {
                found = true;
                break;
            }

        }

        return found;

    }
}

module.exports = {RolesHandler};
