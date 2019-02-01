/**
 * Il se réveille en dernier toutes les nuits et peut désigner au maître du jeu un joueur qu'il pense être
 * le loup-garou. Ce joueur aura automatiquement deux voix contre lui pour le prochain vote.
 * Le corbeau est donc un personnage important car comme il est avec les villageois,
 * il montre logiquement une personne qu'il pense être le loup-garou, et donc ne bluffe pas.
 */

const Villageois = require("../baseRole").Villageois;

class Corbeau extends Villageois {
    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Corbeau";

        return this;
    }
}

module.exports = {

    Corbeau

};