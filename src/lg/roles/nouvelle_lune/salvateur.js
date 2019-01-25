const send = require("../../message_sending");
const lg_func = require("../../lg_functions");
const Villageois = require("../baseRole").Villageois;

class Salvateur extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Salvateur";

        this.targetChoice = undefined;

        return this;
    }

}

module.exports = {Salvateur,

    /**
     * Le salvateur peut protéger quelqu'un de son choix pendant la nuit ; il peut aussi se protéger lui-même ;
     * toutefois, il ne peut pas protéger la même personne deux nuits de suite. Il est nécessaire que le Salvateur
     * soit actif avant la sorcière ; en effet, //todo lorsque vous enverrez la victime du jour à la sorcière, si le
     * salvateur l'a protégée par un heureux hasard, l'a sorcière ne saura rien de la victime du jour, et ne
     * pourra utiliser que sa potion de poison.
     * @param client
     * @param message
     * @returns {Promise<any>}
     */
    salvateur: (client, message) => new Promise((resolve, reject) => {
        let g_set = client.guilds_settings.get(message.guild.id);

        if (g_set.LG.role_players_id.Salvateur.length === 0) {
            resolve(null);
        }

        send.message_to_village(client, message, "J'appelle le **Salvateur**.").catch(err => reject(err));

        let salvateur_id = g_set.LG.role_players_id.Salvateur[lg_func.get_random_index(g_set.LG.role_players_id.Salvateur)];
        let salvateur = g_set.LG.players[salvateur_id];

        // String
        let players = '';

        // Id list
        let players_array = [];
        let i = 1;

        Object.keys(g_set.LG.players).forEach(player_id => {

            if (g_set.LG.players[player_id].alive) {

                if (g_set.LG.salvateur_choice && player_id === g_set.LG.salvateur_choice) {
                    return;
                }

                players += `**${i}** - *${g_set.LG.players[player_id].display_name}*\n`;
                players_array.push(player_id);
                i += 1;

            }
        });

        salvateur.member_object.createDM().then(chan => {

            chan.send(`Qui veux-tu protéger ?\n\n${players}`).catch(err => reject(err));

            const salvateur_answer = chan.createMessageCollector(m => m.author.id === salvateur_id, {max: 120000});

            salvateur_answer.on('collect', message => {

                if (!message.content) {
                    console.log('Empty message.');

                    let target = g_set.LG.players[Object.keys(g_set.LG.players)[lg_func.get_random_index(Object.keys(g_set.LG.players))]];

                    target.immunity = true;
                    chan.send(`${target.display_name} est protégé pour ce tour.`).catch(err => reject(err));
                    console.log(`Immunité de ${target.display_name} : ${target.immunity}`);
                }
                else {

                    let answer = message.content.split(' ');

                    if (answer.length !== 1) {
                        if (answer.length > 1) {
                            chan.send('Tu ne peux protéger qu\'une seule personne. Entre un numéro.')
                                .catch(err => reject(err));
                        }
                        return;
                    }

                    if (isNaN(parseInt(answer[0]))) {
                        chan.send('Entre un nombre.')
                            .catch(err => reject(err));
                        return;
                    }

                    if (!g_set.LG.players[players_array[parseInt(answer[0]) - 1]]) {

                        chan.send(`Les numéros vont de ${players_array.length - players_array.length + 1} à ${players_array.length}.`)
                            .catch(err => reject(err));
                        return;
                    }

                    let target = g_set.LG.players[players_array[parseInt(answer[0]) - 1]];

                    g_set.LG.salvateur_choice = target.id;
                    g_set.LG.players[players_array[parseInt(answer[0]) - 1]].immunity = true;

                    chan.send(`${target.display_name} est protégé pour ce tour.`)
                        .catch(err => reject(err));
                    console.log(`Immunité de ${target.display_name} : ${target.immunity}`);

                    salvateur_answer.stop('Salvateur turn done');
                }

            });

            salvateur_answer.on('end', () => {
                //variables amoureuxX utilisables dans la fonction du jour, (if a1 est mort alors a2 aussi, par exemple)
                send.message_to_village(client, message, 'Le **Salvateur** se rendort.')
                    .catch(err => reject(err));
                resolve(null);
            });

        });
    })
};
