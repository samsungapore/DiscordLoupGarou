const send = require("../../message_sending");
const Villageois = require("../baseRole").Villageois;
const salvateur = require("../nouvelle_lune/salvateur").salvateur;
let RichEmbed = require('discord.js').RichEmbed;

class Voyante extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Voyante";

        return this;
    }

}

module.exports = {Voyante,

    voyante: (client, message) => new Promise((resolve, reject) => {

        const lg_functions = require('../../lg_functions.js');
        const lg_var = require('../../lg_var.js');
        let g_set = client.guilds_settings.get(message.guild.id);

        if (g_set.LG.role_players_id.Voyante.length === 0) {
            console.log('No voyante, moving forward');
            resolve(null);
            return;
        }

        send.message_to_village(client, message, "J'appelle la **Voyante**.").catch(err => reject(err));

        let voyante = g_set.LG.players[g_set.LG.role_players_id.Voyante[lg_functions.get_random_index(g_set.LG.role_players_id.Voyante)]];

        let allplayers = lg_functions.get_player_list(client, message, g_set.LG.role_players_id.Voyante);

        voyante.member_object.createDM().then(chan => {

            chan.send(new RichEmbed().setColor(lg_var.botColor).setAuthor("Voyante", lg_var.roles_img.Voyante)
                .setDescription("*exemple commande :* vote 1")
                .addField("De quelle personne veux-tu voir le rôle ?", allplayers.string)
                .setFooter("Tu as 2 minutes pour faire ton choix avant que ton tour ne soit passé."))
                .catch(err => reject(err));

            let msg_timeout = setTimeout(() => {
                chan.send("Il te reste 20 secondes pour faire ton choix.").catch(console.error);
            }, 100000);

            const voyante_answer = chan.createMessageCollector(m => m.author.id === voyante.id, {time: 120000});

            voyante_answer.on('collect', message => {

                if (!message.content) {
                    console.log('Empty message.');

                    let target = g_set.LG.players[lg_functions.get_random_index(g_set.LG.players)];

                    chan.send(`${target.display_name} est **${target.role}**.`)
                        .catch(err => reject(err));

                } else {


                    let answer = message.content.toLowerCase().trim().split(/ +/g);

                    if (answer.shift() !== "vote") {
                        return;
                    }

                    if (answer.length !== 1) {
                        if (answer.length > 1) {
                            chan.send('Tu ne peux connaître le rôle que d\'une seule personne. Entre un numéro.')
                                .catch(err => reject(err));
                        }
                        return;
                    }

                    if (isNaN(parseInt(answer[0]))) {
                        chan.send('Entre un nombre.').catch(err => reject(err));
                        return;
                    }

                    if (!g_set.LG.players[allplayers.array[parseInt(answer[0]) - 1]]) {

                        chan.send(`Les numéros vont de 1 à ${allplayers.array.length}.`).catch(err => reject(err));
                        return;
                    }

                    let target = g_set.LG.players[allplayers.array[parseInt(answer[0]) - 1]];

                    chan.send(`${target.display_name} est **${target.role}**.`).catch(err => reject(err));
                    send.message_to_village(client, message,
                        `:eye_in_speech_bubble: ${target.role} repéré par la Voyante.`
                    ).catch(console.error);

                    voyante_answer.stop('Voyante turn done');
                }
            });

            voyante_answer.on('end', () => {
                send.message_to_village(client, message, 'La **Voyante** se rendort.');
                clearTimeout(msg_timeout);
                resolve(null);
            });

        });

    }),

};
