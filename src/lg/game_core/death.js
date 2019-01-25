module.exports = {

    kill_players: (client, message) => {
        const lg_var = require('../lg_var.js');
        const lg_functions = require('../lg_functions.js');
        let g_set = client.guilds_settings.get(message.guild.id);

        g_set.LG.DEATHS_ID.forEach(id => {

            if (!g_set.LG.players[id]) {
                return;
            }

            if (!g_set.LG.players[id].immunity) {

                if (g_set.LG.players[id].amoureux) {
                    g_set.LG.players[g_set.players[id].amoureux].member_object.addRole(g_set.LG.lg_game_roles.MortLG.object).catch(console.error);
                    g_set.LG.players[g_set.players[id].amoureux].member_object.removeRole(g_set.LG.lg_game_roles.JoueurLG.object).catch(console.error);
                    g_set.LG.players[g_set.players[id].amoureux].alive = false;

                    let role_name = g_set.LG.players[g_set.players[id].amoureux].role;
                    g_set.LG.role_players_id[role_name].splice(g_set.LG.role_players_id[role_name].indexOf(id), 1);
                }

                g_set.LG.players[id].member_object.addRole(g_set.LG.lg_game_roles.MortLG.object).catch(console.error);
                g_set.LG.players[id].member_object.removeRole(g_set.LG.lg_game_roles.JoueurLG.object).catch(console.error);
                g_set.LG.players[id].alive = false;

                let role_name = g_set.LG.players[id].role;
                g_set.LG.role_players_id[role_name].splice(g_set.LG.role_players_id[role_name].indexOf(id), 1);

            } else {

                // Remove in DEATH_ID object.
                g_set.LG.players[id].immunity = false;
                g_set.LG.DEATHS_ID.splice(g_set.LG.DEATHS_ID.indexOf(id), 1);

                if (g_set.LG.players[id].amoureux) {

                    g_set.LG.DEATHS_ID.splice(g_set.LG.DEATHS_ID.indexOf(g_set.LG.players[id].amoureux), 1);

                }

            }

        });

    },

    print_supposed_deaths: (client, message) => {
        const lg_var = require('../lg_var.js');
        const lg_functions = require('../lg_functions.js');
        let gSettings = client.guilds_settings.get(message.guild.id);

        let msg = 'Should die : ';
        gSettings.DEATHS_ID.forEach(id => {

            try {
                msg += `${gSettings.players[id].display_name}, `;

            } catch (err) {
                console.error(err);
            }

        });

        try {
            msg = msg.slice(0, msg.length - 2) + '.';
        } catch (err) {
            console.error(err);
        }

        console.log(msg);

    },

    compute_deaths: (client, message) => {
        const lg_var = require('../lg_var.js');
        const lg_functions = require('../lg_functions.js');
        let gSettings = client.guilds_settings.get(message.guild.id);

        let target = gSettings.players[gSettings.vote_data['result']];

        if (!target) return;

        // If the player has immunity
        if (target.immunity) {

            // The player is not killed
            target.immunity = false;

        } else {

            gSettings.DEATHS_ID.push(gSettings.vote_data['result']);

        }

    },

};