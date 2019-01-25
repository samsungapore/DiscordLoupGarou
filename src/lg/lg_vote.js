const Sondage = require("../functions/cmds/referendum").SondageInfiniteChoice;
const CommunicationHandler = require("./message_sending.js").CommunicationHandler;

class Vote {

    constructor(question, configuration, time, channel, maxVotes) {

        this.question = question;
        this.configuration = configuration;
        this.time = time;
        this.channel = channel;

        this.maxVotes = maxVotes;

        return this;
    }

    everyone(exceptionArray) {
        return new Promise((resolve, reject) => {

            let playersIdName = this.configuration.getPlayersIdName();
            let ids = Array.from(playersIdName.keys());
            let names = Array.from(playersIdName.values());

            console.log(`exception array : ${exceptionArray} ids : ${ids} names : ${names}`);
            if (exceptionArray && exceptionArray.length > 0) {
                exceptionArray.forEach(exception => {

                    let index = ids.indexOf(exception);

                    ids.splice(index, 1);
                    names.splice(index, 1);

                });
            }
            console.log(`ids : ${ids} names : ${names}`);

            new Sondage(
                this.question, names, this.channel, this.time,
                CommunicationHandler.getLGSampleMsg(),
                true, true, this.maxVotes
            ).post().then((choiceArray) => {

                console.log(`choiceArray: ${choiceArray}`);

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

}

class VillageoisVote extends Vote {

    constructor(question, configuration, time, channel, maxVotes) {
        super(question, configuration, time, channel, maxVotes);

        return this;
    }

}

module.exports = {Vote, LoupGarouVote, VillageoisVote};
