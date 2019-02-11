const send = require("../../message_sending");
const Villageois = require("../baseRole").Villageois;
const get_player_list = require("../../lg_functions").get_player_list;
const EveryOneVote = require("../../lg_vote.js").EveryOneVote;

class Cupidon extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Cupidon";

        this.id1 = undefined;
        this.id2 = undefined;

        this.dmChannel = undefined;

        return this;
    }

    getChoice(configuration) {
        return new Promise((resolve, reject) => {

            this.GameConfiguration = configuration;

            this.member.createDM().then(privateChannel => {

                this.dmChannel = privateChannel;

                return new EveryOneVote(
                    "Veuillez choisir le premier élu",
                    this.GameConfiguration,
                    40000, this.dmChannel, 1
                ).runVote();

            }).then(outcome => {

                if (!outcome || outcome.length === 0) {

                    this.dmChannel.send("Tu n'as pas fait ton choix, ton tour est terminé").catch(console.error);
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "**Cupidon** se rendort."
                    ).then(() => resolve([undefined, undefined])).catch(err => reject(err));
                    return;

                } else if (outcome.length === 1) {

                    this.id1 = outcome.shift();

                } else {
                    return reject("Plusieurs votes ont été fait pour cupidon, situation impossible");
                }

                return new EveryOneVote(
                    "Veuillez choisir son/sa partenaire",
                    this.GameConfiguration,
                    40000, this.dmChannel, 1
                ).excludeDeadPlayers().runVote([this.id1]);

            }).then(outcome => {

                if (!outcome || outcome.length === 0) {

                    this.dmChannel.send("Tu n'as pas fait ton choix, ton tour est terminé").catch(console.error);
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "**Cupidon** se rendort."
                    ).then(() => resolve([undefined, undefined])).catch(err => reject(err));

                } else if (outcome.length === 1) {

                    this.id2 = outcome.shift();

                    resolve([this.id1, this.id2]);

                } else {
                    return reject("Plusieurs votes ont été fait pour cupidon, situation impossible");
                }

            }).catch(err => reject(err));

        });
    }

}

module.exports = {Cupidon};
