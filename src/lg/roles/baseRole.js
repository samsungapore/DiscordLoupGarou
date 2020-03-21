const lg_var = require("../lg_var");
const get_random_in_array = require("../../functions/parsing_functions").get_random_in_array;
const EveryOneVote = require("../lg_vote").EveryOneVote;
const MessageEmbed = require("discord.js").MessageEmbed;

class Player {

    constructor(guildMember) {

        this.member = guildMember;
        this.gameinfo = null;

        this.capitaine = false;
        this.immunity = false;
        this.alive = true;
        this.voted = false;
        this.infected = false;
        this.amoureux = undefined;
        this.role = "Joueur";

        this.permission = {
            thiercelieux_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': true
            },
            village_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
            },
            paradis_lg: {
                'VIEW_CHANNEL': false,
                'SEND_MESSAGES': false,
            },
            loups_garou_lg: {
                'VIEW_CHANNEL': false,
                'SEND_MESSAGES': false,
            },
        };

        this.dmChannel = null;

        return this;
    }

    getDMChannel() {
        return new Promise((resolve, reject) => {

            if (this.dmChannel !== null && this.dmChannel !== undefined) return resolve(this.dmChannel);

            this.member.createDM().then((channel) => {
                this.dmChannel = channel;
                resolve(this.dmChannel);
            }).catch(err => reject(err));
        });
    }

    async die(configuration) {

        let additionnalTargets = [];

        if (this.amoureux && configuration.getPlayerById(this.amoureux).alive) {
            let amoureux = configuration.getPlayerById(this.amoureux);
            additionnalTargets.push(amoureux);
            await configuration.villageChannel.send(new MessageEmbed()
                .setAuthor(`${amoureux.member.displayName} meurt de chagrin`, amoureux.member.user.avatarURL())
                .setThumbnail(lg_var.roles_img[amoureux.role])
                .setTitle(amoureux.role)
                .setColor('RED')
            );
        }

        //si le capitaine meurt go réélire
        if (this.capitaine && configuration.getAlivePlayers().length > 0) {
            let dmChannel = await this.getDMChannel();

            await configuration.channelsHandler.sendMessageToVillage(
                `${this.member.displayName}, le Capitaine, est mort(e), il va maintenant désigner son successeur`
            );

            let outcome = await new EveryOneVote(
                "Qui sera ton successeur ?",
                configuration,
                30000,
                dmChannel,
                1
            ).excludeDeadPlayers().runVote([this.member.id]);

            let newCapitaine = null;

            if (!outcome || outcome.length === 0) {
                newCapitaine = get_random_in_array(configuration.getAlivePlayers());
            } else {
                newCapitaine = configuration.getPlayerById(outcome[0]);
            }

            this.capitaine = false;
            newCapitaine.capitaine = true;

            await configuration.channelsHandler.sendMessageToVillage(
                `${newCapitaine.member.displayName} est le nouveau Capitaine de Thiercelieux !`,
                lg_var.roles_img.Capitaine
            );

        }

        await configuration.villageChannel.send(new MessageEmbed()
            .setAuthor(`${this.member.displayName} est mort(e)`, this.member.user.avatarURL())
            .setTitle(this.role)
            .setImage(this.member.user.avatarURL())
            .setThumbnail(lg_var.roles_img[this.role])
            .setColor('RED')
        );

        return additionnalTargets.length === 0 ? false : additionnalTargets;
    }

}

class LoupGarou extends Player {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.team = "LG";
        this.role = "LoupGarou";

        this.permission = {
            thiercelieux_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': true
            },
            village_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
            },
            paradis_lg: {
                'VIEW_CHANNEL': false,
                'SEND_MESSAGES': false,
            },
            loups_garou_lg: {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
            },
        };

        return this;
    }

}

class Villageois extends Player {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.team = "VILLAGEOIS";
        this.role = "Villageois";

        return this;
    }

}

module.exports = {Player, Villageois, LoupGarou};
