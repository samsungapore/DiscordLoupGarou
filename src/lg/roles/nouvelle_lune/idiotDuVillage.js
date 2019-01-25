const Villageois = require("../baseRole").Villageois;

class IdiotDuVillage extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "IdiotDuVillage";

        return this;
    }

}

module.exports = {IdiotDuVillage};
