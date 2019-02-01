const Villageois = require("../baseRole").Villageois;

class PetiteFille extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "PetiteFille";

        return this;
    }

}

module.exports = {PetiteFille};
