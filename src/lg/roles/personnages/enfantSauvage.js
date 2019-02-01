const RichEmbed = require("discord.js").RichEmbed;
const lg_var = require("../../lg_var.js");
const Villageois = require("../baseRole").Villageois;

/**
 * L'enfant sauvage choisit un autre joueur au début de la partie qui devient son modèle.
 * //todo: Si le modèle meurt, l'enfant sauvage devient un loup-garou.
 */
class EnfantSauvage extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "EnfantSauvage";
        this.model = null;

        return this;
    }

    proposeModel(gameConf) {
        return new Promise((resolve, reject) => {

            let dmchanpromise = [];

            if (!this.dmChannel) {
                dmchanpromise.push(this.createDMChannel());
            }

            Promise.all(dmchanpromise).then(() => {

                let propositionMsg = new RichEmbed()
                    .setAuthor(`${this.member.displayName}`, this.member.user.avatarURL)
                    .setTitle('Tu es l\'enfant sauvage')
                    .setDescription("Tu peux choisir ton modèle parmis les autres habitants du village." +
                        " Si ton modèle meurt, tu deviendras un Loup-Garou.");

                const players = gameConf.getPlayersIdName();
                let idArray = [];
                let nameArray = [];

                for (let [id, name] of players) {
                    idArray.push(id);
                    nameArray.push(name);
                }

                return this.dmChannel.send(propositionMsg);

            }).catch(err => reject(err));

        });
    }

}

module.exports = {EnfantSauvage};
