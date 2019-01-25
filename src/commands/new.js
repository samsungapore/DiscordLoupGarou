let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");

exports.run = (LGBot, message, args) => {

    let LG = LGBot.LG.get(message.guild.id);

    if (LG === undefined || LG === null) {
        LG = botData.LG;
        LGBot.LG.set(message.guild.id, LG);
    }

    if (!LG.running) {
        LG.running = true;
        new LoupGarou.Game(LGBot, message).launch();
    } else {
        message.channel.send("Partie de LG déjà en cours").catch(console.error);
    }

    if (args[0] === "stat") {
        message.channel.send(JSON.stringify(LG)).catch(console.error);
    }

};
