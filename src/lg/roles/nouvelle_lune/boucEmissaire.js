const Villageois = require("../baseRole").Villageois;

class BoucEmissaire extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "BoucEmissaire";

        return this;
    }

}

module.exports = {BoucEmissaire};
