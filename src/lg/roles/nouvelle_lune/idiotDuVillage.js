const Villageois = require("../baseRole").Villageois;

class IdiotDuVillage extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "IdiotDuVillage";

        return this;
    }

}

module.exports = {IdiotDuVillage};
