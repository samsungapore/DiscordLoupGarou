const Villageois = require("../baseRole").Villageois;

class Chasseur extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Chasseur";

        return this;
    }

}

module.exports = {Chasseur};
