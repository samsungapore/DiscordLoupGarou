const RichEmbed = require("discord.js").RichEmbed;
const LgLogger = require("../../lg_logger");
const VillageoisVote = require("../../lg_vote").VillageoisVote;
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

    askForModel(gameConf) {
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

                return this.dmChannel.send(propositionMsg);

            }).then(() => {

                return new VillageoisVote(
                    'Qui prenez-vous comme modèle ?',
                    gameConf,
                    30000,
                    this.dmChannel,
                    1
                ).everyone([this.member.id]);

            }).then(outcomeIdArray => {

                if (outcomeIdArray.length === 0) {

                    LgLogger.info("L'enfant sauvage n'a pas pris de modèle", this.gameinfo);

                    resolve(this);

                } else if (outcomeIdArray.length === 1) {

                    let model = gameConf._players.get(outcomeIdArray.shift());

                    LgLogger.info(`L'enfant sauvage a pris comme modèle ${model.member.displayName}`);

                    this.model = model;

                    resolve(this);

                } else {
                    reject("Deux votes simultanés pour l'enfant sauvage est impossible");
                }

            }).catch(err => reject(err));

        });
    }

}

module.exports = {EnfantSauvage};
