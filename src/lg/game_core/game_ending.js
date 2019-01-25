const send = require("../message_sending");
const remove_role = require("../init/role_setup").remove_role;
const LGGameObject = require("../lg_var").LGGameObject;

function reset_game(client, message) {

    let gSettings = client.guilds_settings.get(message.guild.id);
    let quitGamePromises = [];

    LG.quitting_game = true;

    send.message_curr_chan(message, "LG - Fin du jeu", "Suppression des roles et des salons...")
        .catch(console.error);

    //Deleting channels created
    Object.keys(LG.lg_game_channels).forEach(channel_name => {
        if (LG.lg_game_channels[channel_name]) {
            quitGamePromises.push(LG.lg_game_channels[channel_name].delete());
        }
    });

    // Deleting roles created
    Object.keys(LG.lg_game_roles).forEach(role_name => {

        remove_role(client, message, role_name).catch(console.error);

    });

    if (LG.lg_to_petite_fille) {
        LG.lg_to_petite_fille.stop();
    }

    if (LG.game_timeout) {
        clearTimeout(LG.game_timeout);
    }

    LG.timeout_list.forEach(timeout => {
        clearTimeout(timeout);
    });

    LG.message_collector_list.forEach(collector => {
        collector.stop();
    });

    Promise.all(quitGamePromises).then(() => {
        if (LG.categoryChan) {
            LG.categoryChan.delete().then(() => {

                LG = new LGGameObject();
                send.message_curr_chan(message, 'LG - Jeu', 'La partie est terminée.').catch(console.error);

            }).catch(console.error);
        } else {

            LG = new LGGameObject();
            send.message_curr_chan(message, 'LG - Jeu', 'La partie est terminée.').catch(console.error);

        }
    }).catch(console.error);


}

module.exports = {

    reset_game,

    quit_game_on_error: (client, rejected, message, error_msg) => {

        console.error(rejected);
        console.error("Error encountered, finishing the game");

        message.channel.send({
            embed: {
                color: 7419530,
                fields: [{
                    name: 'LG - Erreur',
                    value: error_msg
                }]
            }
        }).catch(console.error);

        reset_game(client, message);
    },

    is_game_complete: (client, message) => {

        let gSettings = client.guilds_settings.get(message.guild.id);

        let lg = 0;
        let villageois = 0;
        let vivant = 0;
        let mort = 0;

        Object.keys(LG.players).forEach(player_id => {

            if (LG.players[player_id].alive) {

                if (LG.role_players_id.LoupGarou.includes(player_id)) {
                    lg += 1;

                } else {
                    villageois += 1;

                }
                vivant += 1;

            } else {
                mort += 1;

            }

        });

        console.log(`Villageois : ${villageois}, Loup garou : ${lg}, Vivant : ${vivant}, Mort : ${mort}`);

        if (vivant === 0) {
            send.msg(message, LG.stemming_channel, 'LG - Résultats', 'Tout le monde est mort ! Match nul.');
            return true;

        } else if (vivant === 2) {

            let survivors = [];
            Object.keys(LG.players).forEach(player_id => {
                if (LG.players[player_id].alive) {
                    survivors.push(player_id);
                }
            });

            if (LG.players[survivors[0]].amoureux) {

                if (LG.players[LG.players[survivors[0]].amoureux].alive) {

                    let player = LG.players[survivors[0]];
                    send.msg(message, LG.stemming_channel, 'LG - Résultats', `Le couple **${player.display_name}** et **${gSettings.players[player.amoureux].display_name}** a gagné la partie !`);
                    return true;

                }

            }

        }

        if (lg === 0) {
            console.log('Villageois win');

            let survivors = '';
            Object.keys(LG.players).forEach(player_id => {
                if (LG.players[player_id].alive) {
                    survivors += `**${LG.players[player_id].display_name}** : *${LG.players[player_id]['role']}*\n`;
                }
            });

            send.msg(message, LG.stemming_channel, 'LG - Résultats', 'Les **Villageois** ont gagné la partie !');
            send.msg(message, LG.stemming_channel, 'LG - Gagnants', survivors);

            return true;

        } else if (villageois === 1) {
            console.log('Loup garou win');

            let survivors = '';
            Object.keys(LG.players).forEach(player_id => {
                if (LG.players[player_id].alive) {
                    survivors += `**${LG.players[player_id].display_name}** : *${LG.players[player_id]['role']}*\n`;
                }
            });

            send.msg(message, LG.stemming_channel, 'LG - Résultats', 'Les **Loups-garou** ont gagné la partie !');
            send.msg(message, LG.stemming_channel, 'LG - Gagnants', survivors);

            return true;

        } else {
            return false;
        }

    },

};
