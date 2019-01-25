const send = require("../message_sending");
const night = require("./night").night;
const reset_game = require("./game_ending").reset_game;
const is_game_complete = require("./game_ending").is_game_complete;
const kill_players = require("./death").kill_players;

let memset_vote_data = (client, message, players_id_array) => {

    const lg_var = require('../lg_var.js');
    const lg_functions = require('../lg_functions.js');
    let gSettings = client.guilds_settings.get(message.guild.id);

    players_id_array.forEach(player_id => {
        LG.vote_data.votes[player_id] = 0;
    });
};

let reset_vote_data = (client, message) => {
    const lg_var = require('../lg_var.js');
    const lg_functions = require('../lg_functions.js');
    let gSettings = client.guilds_settings.get(message.guild.id);
    LG.vote_data = {
        result: '',
        votes: {}
    };
};

let clear_players_vote = (client, message) => {
    const lg_var = require('../lg_var.js');
    const lg_functions = require('../lg_functions.js');
    let gSettings = client.guilds_settings.get(message.guild.id);

    Object.keys(LG.players).forEach(player_id => {

        LG.players[player_id].has_voted = false;

    });

};

let clear_lg_vote = (client, message) => {
    const lg_var = require('../lg_var.js');
    const lg_functions = require('../lg_functions.js');
    let gSettings = client.guilds_settings.get(message.guild.id);

    LG.role_players_id.LoupGarou.forEach(player_id => {

        LG.players[player_id].has_voted = false;

    });

};

let showVoteStatus = (client, message, playerArray, channelToSend) => {
    let g_set = client.guilds_settings.get(message.guild.id);
    let vote_status_msg = '';
    let i = 1;
    let villageois_name;
    let villageois_vote_count;

    playerArray.forEach(id => {

        villageois_name = g_set.LG.players[id].display_name;
        villageois_vote_count = g_set.LG.vote_data.votes[id];

        vote_status_msg += `**${i}** - *${villageois_name}* : ${villageois_vote_count} vote(s).\n`;
        i += 1;
    });

    return channelToSend.send({
        embed: {
            color: 7419530,
            fields: [{
                name: 'LG - Votes',
                value: vote_status_msg
            }]
        }
    });
};

module.exports = {

    clear_lg_vote, clear_players_vote, reset_vote_data, memset_vote_data, showVoteStatus,

    /**
     * Return true if input is wrong, false if correct
     * @param answer : the answer parsed
     * @param sender : the sender (player[id] object)
     * @param client
     * @param message
     * @returns {boolean}
     */
    wrong_input: (answer, sender, client, message) => {
        let gSettings = client.guilds_settings.get(message.guild.id);
        const lg_functions = require('../lg_functions.js');

        if (sender.has_voted) {

            send.msg(message, LG.lg_game_channels.village_lg,
                'LG - Votes', `Tu as déjà voté, ${sender.display_name}.`);
            return true;
        }

        if (answer.length !== 1) {
            if (answer.length > 1) {
                send.msg(message, LG.lg_game_channels.village_lg,
                    'LG - Votes', `Tu ne peux voter que pour une seule` +
                    ` personne, ${sender.display_name}. Entre un numéro.`);
            }
            return true;
        }

        if (isNaN(parseInt(answer[0]))) {
            send.msg(message, LG.lg_game_channels.village_lg,
                'LG - Votes', 'Veuillez entrer un nombre.');
            return true;
        }

        return false;
    },

    check_vote: (client, message) => {
        const lg_functions = require('../lg_functions.js');
        const lg_var = require('../lg_var.js');
        let gSettings = client.guilds_settings.get(message.guild.id);

        let highest = 0;

        let votes_array = Object.keys(LG.vote_data.votes);
        // Init with random
        let highest_id = votes_array[lg_functions.get_random_index(votes_array)];
        votes_array.forEach(id => {

            if (highest < LG.vote_data.votes[id]) {
                highest = LG.vote_data.votes[id];
                highest_id = id;
            }

        });

        let res = highest_id;
        let count_dupes = 0;
        Object.keys(LG.vote_data.votes).forEach(id => {

            if (highest === LG.vote_data.votes[id]) {
                res = id;
                count_dupes += 1;
            }

        });

        LG.vote_data.result = res;

        return count_dupes === 1;

    },

    all_players_voted: (client, message) => {
        const lg_functions = require('../lg_functions.js');
        const lg_var = require('../lg_var.js');
        let gSettings = client.guilds_settings.get(message.guild.id);

        let all_voted = true;

        Object.keys(LG.players).forEach(player_id => {

            if (LG.players[player_id].alive && !LG.players[player_id].has_voted) {
                all_voted = false;
            }

        });

        console.log(`All players voted : ${all_voted}`);
        return (all_voted);
    },

    all_lg_voted: (client, message) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        let all_voted = true;

        LG.role_players_id.LoupGarou.concat(
            LG.role_players_id.LoupBlanc
        ).forEach(lg_id => {

            if (LG.players[lg_id].alive && !LG.players[lg_id].has_voted) {
                all_voted = false;
            }

        });

        console.log(`All lg voted : ${all_voted}`);
        return (all_voted);
    },

    village_vote_outcome: (client, message) => {

        const lg_var = require('../lg_var.js');
        const lg_functions = require('../lg_functions.js');
        let gSettings = client.guilds_settings.get(message.guild.id);


        kill_players(client, message);

        //Première étape : établissement du bilan des morts.
        let bilan_morts;

        if (LG.DEATHS_ID.length === 0) {
            bilan_morts = `Personne n'est mort.`;
        }
        if (LG.DEATHS_ID.length === 1) {
            bilan_morts = `Les villageois ont voté pour ${gSettings.players[gSettings.DEATHS_ID[0]].display_name} (**${gSettings.players[gSettings.DEATHS_ID[0]]['role']}**). ${lg_var.death_sentence[lg_functions.get_random_index(lg_var.death_sentence)]}`;
        }
        if (LG.DEATHS_ID.length > 1) {

            let s = '';
            LG.DEATHS_ID.forEach(id => {
                s += `${gSettings.players[id].display_name} (**${gSettings.players[id]['role']}**), `;
            });
            s = s.slice(0, s.length - 2) + '.';

            bilan_morts = `Les villageois ont voté pour ${gSettings.players[gSettings.DEATHS_ID[0]].display_name}, ${s} sont morts.`;
        }

        LG.lg_game_channels.village_lg.send({
            embed: {
                color: 7419530,
                fields: [{
                    name: 'LG - Sentence',
                    value: `:sunrise_over_mountains: ${bilan_morts} La nuit tombera dans 1 minute et 30 secondes.`,
                }]
            }
        });

        if (is_game_complete(client, message)) {
            setTimeout(function () {
                reset_game(client, message);
            }, 2000);
            return;
        }

        LG.DEATHS_ID = [];
        clear_players_vote(client, message);
        reset_vote_data(client, message);
        LG.revote = false;
        LG.vote_retry_nb = 0;

        setTimeout(function () {
            night(client, message);
        }, 90000)

    },

    /**
     *
     * @param client
     * @param guild from message.guild
     * @param player_array
     * @param channel_to_send
     */
    show_vote_status: (client, guild, player_array, channel_to_send) => {

        let gSettings = client.guilds_settings.get(guild.id);
        let vote_status_msg = '';
        let i = 1;
        let villageois_name;
        let villageois_vote_count;

        player_array.forEach(villageois_id => {

            villageois_name = LG.players[villageois_id].display_name;
            villageois_vote_count = LG.vote_data.votes[villageois_id];

            vote_status_msg += `**${i}** - *${villageois_name}* : ${villageois_vote_count} vote(s).\n`;
            i += 1;
        });

        return channel_to_send.send({
            embed: {
                color: 7419530,
                fields: [{
                    name: 'LG - Votes',
                    value: vote_status_msg
                }]
            }
        });

    },

};
