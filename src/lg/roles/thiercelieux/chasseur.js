const Villageois = require("../baseRole").Villageois;

class Chasseur extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Chasseur";

        return this;
    }

}

module.exports = {Chasseur};
