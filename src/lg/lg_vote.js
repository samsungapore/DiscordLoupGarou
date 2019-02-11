const Sondage = require("../functions/cmds/referendum").SondageInfiniteChoice;
const CommunicationHandler = require("./message_sending.js").CommunicationHandler;

class Vote {

    constructor(question, configuration, time, channel, maxVotes) {

        this.question = question;
        this.configuration = configuration;
        this.time = time;
        this.channel = channel;

        this.maxVotes = maxVotes;

        this.additionnalExceptions = [];

        return this;
    }

    excludeDeadPlayers() {

        for (let player of this.configuration._players.values()) {
            if (!player.alive) this.additionnalExceptions.push(player.member.id);
        }

        return this;
    }

    excludeAlivePlayers() {

        for (let player of this.configuration._players.values()) {
            if (player.alive) this.additionnalExceptions.push(player.member.id);
        }

        return this;
    }

    runVote(exceptionArrayOfIds) {
        return new Promise((resolve, reject) => {

            let playersIdName = this.configuration.getPlayersIdName();
            let ids = [];
            let names = [];

            for (let [id, name] of playersIdName) {
                ids.push(id);
                names.push(name);
            }

            exceptionArrayOfIds = exceptionArrayOfIds.concat(this.additionnalExceptions);

            if (exceptionArrayOfIds && exceptionArrayOfIds.length > 0) {
                exceptionArrayOfIds.forEach(exception => {

                    let index = ids.indexOf(exception);

                    ids.splice(index, 1);
                    names.splice(index, 1);

                });
            }

            new Sondage(
                this.question, names, this.channel, this.time,
                CommunicationHandler.getLGSampleMsg(),
                true, true, this.maxVotes
            ).post().then((choiceArray) => {

                let result = [];

                choiceArray.forEach(choice => {
                    result.push(ids[choice[0] - 1]);
                });

                resolve(result);

            });
        })
    }

}

class LoupGarouVote extends Vote {

    constructor(question, configuration, time, channel) {
        super(question, configuration, time, channel, configuration.getLG().length);

    }


}

class EveryoneVote extends Vote {

    constructor(question, configuration, time, channel, maxVotes) {
        super(question, configuration, time, channel, maxVotes);

        return this;
    }

}

class VillageoisVote extends Vote {

    constructor(question, configuration, time, channel) {
        super(question, configuration, time, channel, configuration.getVillageois().length);

        return this;
    }

}

module.exports = {Vote, LoupGarouVote, EveryOneVote: EveryoneVote, VillageoisVote};
