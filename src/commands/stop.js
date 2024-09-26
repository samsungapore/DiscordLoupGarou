let botData = require("../BotData.js");
const {checkPermissions} = require("../utils/permission");
const {sendEmbed} = require("../utils/message");
const MessageEmbed = require("../utils/embed");

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

        if (!LG.running) {
            sendEmbed(message.channel, new MessageEmbed().setDescription("Aucune partie en cours").setColor("YELLOW")).catch(console.error);
            return;
        }

        if (!checkPermissions(message.member, "BAN_MEMBERS") && !LG.canRun.includes(message.author.id)) {
            sendEmbed(message.channel, new MessageEmbed().setDescription("Vous n'avez pas la permission de stopper la partie").setColor("RED")).catch(console.error);
            return;
        }

        if (LG.running) {
            LG.running = false;
        }

        if (LG.game) {
            LG.game.quit().catch(console.error).finally(() => {
                LG.game = null;

                try {
                    LGBot.LG.set(message.guild.id, LG);
                    sendEmbed(message.channel, new MessageEmbed().setDescription("Partie stoppée").setColor("GREEN")).catch(console.error);
                } catch (e) {
                    console.error(e);
                }
            });
        } else {
            try {
                LGBot.LG.set(message.guild.id, LG);
                sendEmbed(message.channel, new MessageEmbed().setDescription("Partie interrompue").setColor("YELLOW")).catch(console.error);
            } catch (e) {
                console.error(e);
            }
        }
    },
};
