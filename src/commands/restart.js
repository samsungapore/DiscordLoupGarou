const RichEmbed = require('discord.js').RichEmbed;
let botData = require("../BotData.js");

let restartBot = (message) => {
    const {exec} = require('child_process');
    exec('pm2 restart discordlgbot', (err, stdout, stderr) => {
        if (err) {
            console.log("Couldn't reboot bot");
            message.channel.send("Le reboot a échoué.").catch(console.error);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
};

let getOccupiedGuilds = (LGBot) => {

    let occupiedGuilds = [];

    LGBot.guilds.array().forEach(guild => {

        let LG = LGBot.LG.get(guild.id);

        if (!LG) return;

        if (LG.running) {
            occupiedGuilds.push(LG.stemming);
        }

    });

    return occupiedGuilds;
};

module.exports = {
    name: 'restart',
    description: 'ADMIN|relancer le bot',
    execute(LGBot, message) {
        if (message.author.id === "140033402681163776") {

            let occupiedGuilds = getOccupiedGuilds(LGBot);

            if (occupiedGuilds.length === 0) {
                restartBot(message);
            } else {

                occupiedGuilds.forEach(userId => {
                    LGBot.users.get(userId).send("Veuillez attendre que le bot redémarre avant de lancer une nouvelle " +
                        "partie, vous pouvez terminer la partie en cours. Quand le bot redémmarera, un MP sera envoyé à la" +
                        "personne qui possède le serveur.").catch(console.error);
                });

                let timeout = setInterval(() => {
                    if (getOccupiedGuilds(LGBot).length === 0) {
                        clearInterval(timeout);
                        restartBot(message);
                    }
                }, 1000 * 60)

            }

        }
    },
};
