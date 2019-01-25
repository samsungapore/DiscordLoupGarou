const lg_var = require("../lg_var");
const RichEmbed = require("discord.js").RichEmbed;

class Player {

    constructor(guildMember) {

        this.member = guildMember;

        this.maire = false;
        this.immunity = false;
        this.alive = true;
        this.voted = false;
        this.infected = false;
        this.amoureux = undefined;

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
            petite_fille_lg: {
                'VIEW_CHANNEL': false,
                'SEND_MESSAGES': false,
            }
        };

        return this;
    }

}

class LoupGarou extends Player {

    constructor(guildMember) {
        super(guildMember);

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

    constructor(guildMember) {
        super(guildMember);

        this.team = "VILLAGEOIS";
        this.role = "Villageois";

        return this;
    }

}

module.exports = {Player, Villageois, LoupGarou};
