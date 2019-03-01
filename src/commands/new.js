let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");

module.exports = {
    name: 'new',
    description: 'Lancer une nouvelle partie de Thiercelieux',
    execute(LGBot, message) {
        if (!message.member) {
            return;
        }

        let LG = LGBot.LG.get(message.guild.id);

        if (LG === undefined || LG === null) {
            LG = botData.LG;
            LGBot.LG.set(message.guild.id, LG);
            LG = LGBot.LG.get(message.guild.id);
        }

        console.log(LG.running);

        if (!LG.running) {

            LG.running = true;
            LG.stemming = message.author.id;
            LGBot.LG.set(message.guild.id, LG);
            LG.game = new LoupGarou.Game(LGBot, message);
            LG.game.launch().then(() => {
                LG.game = null;
                LG.running = false;
                LGBot.LG.set(message.guild.id, LG);
            }).catch(err => {
                console.error(err);
                LG.game = null;
                LG.running = false;
                LGBot.LG.set(message.guild.id, LG);
            })

        } else {
            message.channel.send("Partie de LG déjà en cours, pour stopper la partie de force, tapez lg/stop").catch(console.error);
        }
    },
};

