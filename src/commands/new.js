let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");

exports.run = (LGBot, message) => {

    if (!message.member) {
        return;
    }

    let LG = LGBot.LG.get(message.guild.id);

    if (LG === undefined || LG === null) {
        LG = botData.LG;
        LGBot.LG.set(message.guild.id, LG);
    }

    if (!LG.running) {

        LG.running = true;
        LG.game = new LoupGarou.Game(LGBot, message);
        LG.game.launch().catch(err => {
            console.error(err);
        }).finally(() => {
            LG.game = null;
            LG.running = false;
        });

    } else {
        message.channel.send("Partie de LG déjà en cours, pour stopper la partie de force, tapez lg/stop").catch(console.error);
    }

};
