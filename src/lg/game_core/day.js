const BotData = require("../../BotData.js");
const send = require("../message_sending");
const lg_var = require("../lg_var");
const vote_fct = require("./vote");
const compute_deaths = require("./death").compute_deaths;
const RichEmbed = require("discord.js").RichEmbed;
const clear_players_vote = require("./vote").clear_players_vote;
const reset_vote_data = require("./vote").reset_vote_data;
const reset_game = require("./game_ending").reset_game;
const is_game_complete = require("./game_ending").is_game_complete;
const print_supposed_deaths = require("./death").print_supposed_deaths;
const kill_players = require("./death").kill_players;
const night = require("./night").night;
const vote_maire = require("../roles/thiercelieux/maire").vote_maire;

function day_vote(client, message) {

    const lg_var = require('../lg_var.js');
    let LG = client.LG.get(message.guild.id);

    let chan = LG.lg_game_channels.village_lg;

    //Première étape : message d'annonce
    chan.send(new RichEmbed()
        .setColor(BotData.bot_values.botColor)
        .addField(
            "LG - Vote",
            'Les votes sont ouverts ! Il reste 2 minutes avant la tombée de la ' +
            'nuit et donc la fermeture des votes. Attention, les votes sont définitifs.\n\n Veuillez taper **vote <numéro>** ' +
            'pour voter.'
        )
    ).catch(console.error);

    LG.vote_village = chan.createMessageCollector((m) => {
        return !!(m.author.id !== message.guild.me.id && m.content.toLowerCase().startsWith('vote ') && m.content.split(/ +/g)[0] === 'vote');
    });

    //Seconde étape : mise en place du timer de 2 minutes
    const night_timeout = setTimeout(function () {

        if (!vote_fct.check_vote(client, message)) {

            chan.send("Le vote est nul ou vous n'avez pas voté, recommençons.").catch(console.error);
            LG.revote = true;
            LG.vote_village.stop();

        }

        compute_deaths(client, message);
        vote_fct.clear_players_vote(client, message);
        gSettings.vote_village.stop();

    }, lg_var.MINUTE * 2);

    console.log('Night timeout set. (2 min)');

    //Troisième étape : récupération des votes

    let players = '';
    let players_id_array = [];
    let i = 1;
    Object.keys(gSettings.players).forEach(p_id => {

        if (gSettings.players[p_id].alive) {

            players += `**${i}** - *${gSettings.players[p_id].display_name}*\n`;
            players_id_array.push(p_id);
            i += 1;

        }

    });

    chan.send({
        embed: {
            color: 7419530,
            fields: [{
                name: 'LG - Votes',
                value: players
            }]
        }
    });

    vote_fct.reset_vote_data(client, message);
    vote_fct.clear_players_vote(client, message);
    vote_fct.memset_vote_data(client, message, players_id_array);


    gSettings.vote_village.on('collect', message => {

        console.log(`Message collected [${message.content}]`);

        if (!message.content) {
            console.log('Empty message.');
        } else {


            let answer = message.content.slice('vote '.length, message.content.length).split(' ');
            let sender = gSettings.players[message.member.id];

            if (sender.has_voted) {

                send.msg(message, chan, 'LG - Votes', `Tu as déjà voté, ${sender.display_name}.`);
                return;
            }

            if (answer.length !== 1) {
                if (answer.length > 1) {
                    send.msg(message, chan, 'LG - Votes', `Tu ne peux voter que pour une seule` +
                        ` personne, ${sender.display_name}. Entre un numéro.`);
                }
                return;
            }

            if (isNaN(parseInt(answer[0]))) {
                send.msg(message, chan, 'LG - Votes', 'Veuillez entrer un nombre.');
                return;
            }

            let target = gSettings.players[players_id_array[parseInt(answer[0]) - 1]];

            if (!target) {

                send.msg(message, chan, 'LG - Votes', `Les numéros vont de ${players_id_array.length - players_id_array.length + 1} à ${players_id_array.length}.`);
                return;
            }

            gSettings.vote_data['votes'][target.id] += 1;
            sender.has_voted = true;
            console.log('LG - Votes', `${sender.display_name} a voté pour ${target.display_name}.`);

            Object.keys(gSettings.vote_data['votes']).forEach(id => {
                try {
                    console.log(`${gSettings.players[id].display_name} : ${gSettings.vote_data['votes'][id]}`);
                } catch (err) {
                    console.log(err);
                }
            });

            let vote_status_msg = '';
            let i = 1;
            players_id_array.forEach(player_id => {

                if (gSettings.players[player_id].alive) {

                    vote_status_msg += `**${i}** - *${gSettings.players[player_id].display_name}* : ${gSettings.vote_data['votes'][player_id]} vote(s).\n`;
                    i += 1;

                }

            });

            chan.send({
                embed: {
                    color: 7419530,
                    fields: [{
                        name: 'LG - Votes',
                        value: vote_status_msg
                    }]
                }
            });

            if (vote_fct.all_players_voted(client, message)) {

                if (!vote_fct.check_vote(client, message)) {
                    gSettings.vote_retry_nb += 1;

                    if (gSettings.vote_retry_nb < 3) {

                        chan.send(`Le vote est nul ou vous n'avez pas voté, recommençons. Il reste ${3 - gSettings.vote_retry_nb} essai(s), après quoi une personne au hasard sera choisie.`);
                        clearTimeout(night_timeout);
                        gSettings.revote = true;
                        gSettings.vote_village.stop();

                    } else {

                        chan.send(`Le vote est nul ou vous n'avez pas voté, une personne va être exécutée au hasard parmi les villageois.`);

                        compute_deaths(client, message);

                        vote_fct.clear_players_vote(client, message);
                        gSettings.vote_village.stop();

                    }


                } else {

                    compute_deaths(client, message);

                    vote_fct.clear_players_vote(client, message);

                    gSettings.vote_village.stop();

                }

            }


        }

    });

    LG.vote_village.on('end', collected => {

        console.log(`${collected.size} messages collected in village channel for the vote`);

        if (LG.revote) {

            LG.revote = false;
            return (day_vote(client, message));

        } else {

            clearTimeout(night_timeout);

            vote_fct.village_vote_outcome(client, message);

        }

    });

}

let get_death_outcome = (client, message) => {
    let g_set = client.guilds_settings.get(message.guild.id);
    let bilan_morts;
    let avatar = [];
    let dead_name = [];

    kill_players(client, message);

    print_supposed_deaths(client, message);

    if (g_set.LG.DEATHS_ID.length === 0) {
        bilan_morts = `Cette nuit, personne n'est mort.`;
    }
    if (g_set.LG.DEATHS_ID.length === 1) {
        avatar.push(g_set.LG.players[g_set.LG.DEATHS_ID[0]].member_object.user.displayAvatarURL);
        dead_name.push(g_set.LG.players[g_set.LG.DEATHS_ID[0]].display_name);

        bilan_morts = `Cette nuit, ${g_set.LG.players[g_set.LG.DEATHS_ID[0]].display_name} est mort. Il était **${g_set.LG.players[g_set.LG.DEATHS_ID[0]]['role']}**`;
    }
    if (g_set.LG.DEATHS_ID.length > 1) {

        let s = '';
        g_set.LG.DEATHS_ID.forEach(mort_id => {

            s += `${g_set.LG.players[mort_id].display_name} (**${g_set.LG.players[mort_id]['role']}**), `;

            avatar.push(g_set.LG.players[mort_id].member_object.user.displayAvatarURL);
            dead_name.push(g_set.LG.players[mort_id].display_name);

        });
        s = s.slice(0, s.length - 2) + '.';

        bilan_morts = `Cette nuit, ${s} sont morts.`;
    }

    return {
        outcome_msg: bilan_morts,
        avatars: avatar,
        deads_names: dead_name
    }
};

/**
 * A la fin de la nuit, juste avant d'annoncer le jour,on annonce alors aux charmés (par Mp)
 * qu'ils l'ont été, ainsi que l'identité de tous les autres charmés.
 * @param client
 * @param message
 */
let joueur_de_flute_checks = (client, message) => {
    let g_set = client.guilds_settings.get(message.guild.id);
    const lg_var = require('../lg_var.js');
    const lg_functions = require('../lg_functions.js');

    let exception_id_array = [g_set.LG.role_players_id.JoueurDeFlute[0]];
    let amoureux_id = g_set.LG.players[g_set.LG.role_players_id.JoueurDeFlute[0]].amoureux;
    if (amoureux_id) {
        exception_id_array.push(amoureux_id);
    }
    let all_players = lg_functions.get_player_list(client, message, exception_id_array).array;
    g_set.LG.charmed_players_id_tmp_array.forEach(p_id => {
        g_set.LG.players[p_id].member_object.send("Tu as été charmé par le joueur de flûte.")
            .catch(console.error);

    });
    g_set.LG.charmed_players_id_tmp_array = [];
    g_set.LG.charmed_players_id.forEach(charmed_p_id => {

        all_players.splice(all_players.indexOf(charmed_p_id), 1);

        let charmed_players = '';
        g_set.LG.charmed_players_id.forEach(charmed_player_id => {
            if (charmed_player_id !== charmed_p_id) {
                charmed_players += `${g_set.LG.players[charmed_player_id].display_name}\n`;
            }
        });

        g_set.LG.players[charmed_p_id].member_object.send("Voici les autres personnes charmées :\n\n" + charmed_players)
            .catch(console.error);

    });

    // Si le joueur de flûte a charmé tous les joueurs, alors il gagne la partie seul / ou avec son amour.
    // La partie se poursuit ensuite
    if (all_players.length === 0) {

        let winners = [g_set.LG.role_players_id.JoueurDeFlute[0]];
        let amoureux_id = g_set.LG.players[g_set.LG.role_players_id.JoueurDeFlute[0]].amoureux;
        let amoureux_str = '';
        if (amoureux_id) {
            winners.push(amoureux_id);
            amoureux_str += `Il gagne la partie avec son amour ${g_set.LG.players[amoureux_id].display_name} !`;
        }

        send.message_to_village(client, message,
            `Le joueur de flûte ${g_set.LG.players[winners[0]].display_name} a réussi à charmer tout le village.\n
                Il peut donc quitter le village victorieux ! ${amoureux_str}`
        ).catch(console.error);

        g_set.LG.role_players_id.JoueurDeFlute.splice(g_set.role_players_id.JoueurDeFlute.indexOf(winners[0]), 1);

        let role_arr = g_set.LG.role_players_id[g_set.LG.players[amoureux_id].role];
        g_set.LG.role_players_id[g_set.LG.players[amoureux_id].role].splice(role_arr.indexOf(amoureux_id), 1);

        winners.forEach(winner => {
            delete g_set.LG.players[winner];
        });

    }
};

module.exports = {

    first_day: (client, message) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        // create message collector on lg channel to retrieve messages and let petite fille see them
        LG.lg_to_petite_fille = LG.lg_game_channels.loups_garou_lg
            .createMessageCollector(() => true);

        LG.lg_to_petite_fille.on('collect', message => {

            // filter player names
            let lgMessage = message.content;

            Object.keys(LG.players).forEach(playerId => {
                lgMessage.replace(LG.players[playerId].display_name, '******');
            });

            // send filtered message
            LG.lg_game_channels.petite_fille_lg.send(lgMessage).catch(console.error);
        });

        LG.lg_game_channels.petite_fille_lg.send(`Tu es la petite fille. Tu peux donc écouter les discussions des loups garous...`).catch(console.error);

        send.message_curr_chan(message, 'LG - Jeu', 'La partie peut commencer !').catch(console.error);

        LG.lg_game_channels.village_lg.send(
            new RichEmbed().setColor(7419530)
                .setAuthor("Les Loups-garous de Thiercelieux [v1.0]", lg_var.roles_img.LoupGarou)
                .setDescription('Développé par Kazuhiro#1248.\n\n*Thiercelieux est un petit village rural d\'apparence paisible,' +
                    ' mais chaque nuit certains villageois se transforment en loups-garou pour dévorer d\'autres villageois...*\n')
                .addField("Règles :",
                    'Les joueurs sont divisés en deux camps : les villageois (certains d\'entre eux jouant ' +
                    'un rôle spécial) et les loups-garou. Le but des villageois est de découvrir et d\'éliminer ' +
                    'les loups-garou, et le but des loups-garou est d\'éliminer tous les villageois.\nPour ' +
                    'les amoureux, leur but est de survivre tous les deux jusqu\'à la fin de la partie.')
                .setFooter("Bienvenue à Thiercelieux, sa campagne paisible, son école charmante, sa population accueillante, ainsi que " +
                    "ses traditions ancestrales et ses mystères inquiétants.", lg_var.roles_img.LoupGarou)
                .setImage(lg_var.roles_img.LoupGarou)
        ).then(() => {

            LG.lg_game_channels.village_lg.send(
            ).catch(console.error);

        }).catch(console.error);

        // vote for the Maire
        vote_maire(client, message).then(userVoted => {

            LG.maire = userVoted;

            send.message_to_village(client, message, 'Le maire est ' + LG.players[userVoted].display_name + '.\nLa nuit tombera dans 1 minute...')
                .catch(console.error);

            LG.game_timeout = setTimeout(() => {
                night(client, message);
            }, 60000);

        }).catch(err => {
            console.error(err);

            send.message_to_village(client, message, 'Le vote du maire a échoué (contactez Kazuhiro#1248).\n' +
                'Cependant le jeu continue et la nuit tombera dans 1 minute...')
                .catch(console.error);

            LG.game_timeout = setTimeout(() => {
                night(client, message);
            }, 60000);
        });

    },

    day: (client, message) => {

        const lg_var = require('../lg_var.js');
        const lg_functions = require('../lg_functions.js');
        let g_set = client.guilds_settings.get(message.guild.id);

        joueur_de_flute_checks(client, message);

        //Première étape : établissement du bilan des morts.
        let outcome = get_death_outcome();
        let avatar = outcome.avatars;
        let dead_name = outcome.deads_names;
        let bilan_morts = outcome.outcome_msg;

        if (avatar.length !== 0) {

            let i = 0;
            avatar.forEach(avatar_link => {

                g_set.LG.lg_game_channels.village_lg.send({
                    embed: {
                        color: 7419530,
                        author: {
                            name: `LG - Mort`,
                            icon_url: avatar_link
                        },
                        description: `${dead_name[i]} est mort(e).`
                    }
                }).catch(console.error);

                i += 1;
            });

        }

        //Troisième étape : envoi du message d'annonce
        g_set.LG.lg_game_channels.village_lg.send({
            embed: {
                color: message.guild.me.displayColor,
                fields: [{
                    name: 'LG - Jour',
                    value: `:sunrise_over_mountains: Le jour se lève.\n
                    ${bilan_morts}\nVous disposez maintenant de 5 minutes pour débattre.
                     Les votes seront ouverts au bout de 3 minutes.`,
                }]
            }
        }).catch(console.error);

        // Reset immunité
        Object.keys(g_set.LG.players).forEach(id => {

            if (g_set.LG.players[id].alive) {

                if (g_set.LG.players[id].immunity) {

                    g_set.LG.players[id].immunity = false;

                }

            }

        });

        if (is_game_complete(client, message)) {

            setTimeout(() => {
                reset_game(client, message);
            }, 10000);
            return;
        }

        // Resetting datas
        g_set.LG.DEATHS_ID = [];
        reset_vote_data(client, message);
        clear_players_vote(client, message);

        setTimeout(() => {
            send.message_to_village(client, message, 'Début des votes dans 60 secondes.');
        }, lg_var.MINUTE * 2);

        setTimeout(() => {
            g_set.LG.vote_retry_nb = 0;
            day_vote(client, message);
        }, lg_var.MINUTE * 3);

        lg_functions.switch_permissions(client, message, 'day');

    },

};
