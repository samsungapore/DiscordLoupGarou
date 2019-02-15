const EveryOneVote = require("../../lg_vote").EveryOneVote;
const Villageois = require("../baseRole").Villageois;

/**
 * Le salvateur peut protéger quelqu'un de son choix pendant la nuit ; il peut aussi se protéger lui-même ;
 * toutefois, il ne peut pas protéger la même personne deux nuits de suite. Il est nécessaire que le Salvateur
 * soit actif avant la sorcière ; en effet, //todo lorsque vous enverrez la victime du jour à la sorcière, si le
 * salvateur l'a protégée par un heureux hasard, l'a sorcière ne saura rien de la victime du jour, et ne
 * pourra utiliser que sa potion de poison.
 */
class Salvateur extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Salvateur";

        this.lastTargetId = null;
        this.targetChoice = null;

        return this;
    }

    async processRole(configuration) {

        this.targetChoice = null;

        let dmChannel = await this.getDMChannel();

        let exceptionIdArray = [this.member.id];

        if (this.lastTargetId && this.lastTargetId !== this.member.id) {
            exceptionIdArray.push(this.lastTargetId);
        }

        let outcome = await EveryOneVote(
            "En tant que Salvateur qui voulez-vous protéger ?",
            configuration,
            40000,
            dmChannel,
            1
        ).excludeDeadPlayers().runVote(exceptionIdArray);

        if (!outcome || outcome.length === 0) {
            this.lastTargetId = null;
        } else if (outcome.length === 1) {
            this.targetChoice = configuration.getPlayerById(outcome[0]);
            this.targetChoice.immunity = true;
            this.lastTargetId = this.targetChoice.member.id;
        } else {
            this.lastTargetId = null;
        }

        return this;

    }

}

module.exports = {Salvateur};
