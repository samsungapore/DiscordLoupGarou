const Villageois = require("../baseRole").Villageois;

class PetiteFille extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "PetiteFille";

        return this;
    }

}

module.exports = {PetiteFille};
