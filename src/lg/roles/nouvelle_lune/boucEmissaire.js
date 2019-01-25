const Villageois = require("../baseRole").Villageois;

class BoucEmissaire extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "BoucEmissaire";

        return this;
    }

}

module.exports = {BoucEmissaire};
