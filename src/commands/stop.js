let botData = require("../BotData.js");

module.exports = {
    name: 'stop',
    description: 'forcer la fin de partie',
    execute(LGBot, message) {
        if (!message.member) {
            return;
        }

        let LG = LGBot.LG.get(message.guild.id);

        if (LG === undefined || LG === null) {
            LG = botData.LG;
            LGBot.LG.set(message.guild.id, LG);
        }

        if (!message.member.hasPermission("BAN_MEMBERS") && !LG.canRun.includes(message.author.id)) {
            message.channel.send("Vous n'avez pas la permission de stopper la partie").catch(console.error);
            return;
        }

        if (LG.running) {
            LG.running = false;
        }

        if (LG.game) {
            LG.game.quit().catch(console.error).finally(() => {
                LG.game = null;

                try {
                    LGBot.LG.set(message.guild.id, LG)
                    message.channel.send("Partie stoppée").catch(console.error);
                } catch (e) {
                    console.error(e);
                }

            });
        } else {

            try {
                LGBot.LG.set(message.guild.id, LG)
                message.channel.send("Partie interrompue").catch(console.error);
            } catch (e) {
                console.error(e);
            }

        }
    },
};
