const get_random_in_array = require("../../../functions/parsing_functions").get_random_in_array;
const EveryOneVote = require("../../lg_vote").EveryOneVote;
const Villageois = require("../baseRole").Villageois;

class Chasseur extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Chasseur";

        return this;
    }

    die(GameConfiguration) {
        return new Promise((resolve, reject) => {

            GameConfiguration.channelsHandler.sendMessageToVillage(
                `${this.member.displayName}, le Chasseur, est mort. Il va maintenant désigner une personne à emporter avec lui.`
            )
                .then(() => this.getDMChannel())
                .then((dmChannel) => new EveryOneVote(
                        "Qui voulez-vous emporter avec vous dans la mort ?",
                        GameConfiguration,
                        40000,
                        dmChannel,
                        1
                    ).excludeDeadPlayers().runVote())
                .then(outcome => {

                    let targets = [];

                    if (!outcome || outcome.length === 0) {
                        targets.push(get_random_in_array(GameConfiguration.getAlivePlayers()));
                    } else {
                        targets.push(GameConfiguration.getPlayerById(outcome[0]));
                    }

                    this.dmChannel.send(`Vous avez choisi ${targets[0].member.displayName}`).catch(console.error);

                    if (this.amoureux) targets.push(this.amoureux);

                    resolve(targets);

                })
                .catch(err => reject(err));

        });
    }

}

module.exports = {Chasseur};
