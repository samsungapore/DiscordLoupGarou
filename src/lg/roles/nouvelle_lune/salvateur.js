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

        this.targetChoice = undefined;

        return this;
    }

    async processRole(configuration) {
        return true;
    }

}

module.exports = {Salvateur};
