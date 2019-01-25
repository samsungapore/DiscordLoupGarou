const send = require("../../message_sending");
const vote_fct = require("../../game_core/vote");
const lg_functions = require("../../lg_functions");
const RichEmbed = require("discord.js").RichEmbed;

module.exports = {

    vote_maire: (client, message) => new Promise((resolve, reject) => {
        let gSettings = client.guilds_settings.get(message.guild.id);
        let player_list = lg_functions.get_player_list(client, message);

        send.message_to_village(client, message,
            `Les villageois se réunissent afin d'élir leur maire.\n
                C'est l'heure du vote !`
        ).catch(err => reject(err));

        vote_fct.reset_vote_data(client, message);
        vote_fct.memset_vote_data(client, message, Object.keys(LG.players));

        LG.lg_game_channels.village_lg.send(
            new RichEmbed().setColor(7419530)
                .addField("LG - Jeu", "Votez le maire en utilisant la commande **vote <numéro du joueur>**")
                .addField("Habitants du village", player_list.string)
        ).catch(err => reject(err));

        let maire_vote_msg_collector = LG.lg_game_channels.village_lg.createMessageCollector((m) => m.author.id !== m.guild.me.id);

        LG.message_collector_list.push(maire_vote_msg_collector);

        // Creating a fail attempt counter
        LG.failAttempt = {};

        maire_vote_msg_collector.on('collect', message => {

            /* If the user types correctly the command, count the vote, else, if the user has failed to write
             * the command 2 times, indicate one more time the usage of the command to vote */
            if (message.content.startsWith('vote ')) {

                let answer = message.content.slice('vote '.length, message.content.length).split(' ');
                let sender = LG.players[message.member.id];

                if (vote_fct.wrong_input(answer, sender, client, message)) {return;}

                let target = LG.players[player_list.array[parseInt(answer[0]) - 1]];

                if (!target) {
                    send.msg(message, LG.lg_game_channels.village_lg,
                        'LG - Votes', `Les numéros vont de ${player_list.array.length - player_list.array.length + 1} à ${player_list.array.length}.`);
                    return;
                }

                LG.vote_data.votes[message.member.id] += 1;

                sender.has_voted = true;

                console.log(`${message.member.displayName} a voté pour ${target.display_name}.`);

                vote_fct.show_vote_status(
                    client,
                    message.guild,
                    player_list.array,
                    LG.lg_game_channels.village_lg)
                    .catch(err => reject(err));

            } else {

                if (message.member.id in LG.failAttempt) {
                    LG.failAttempt[message.member.id] += 1
                } else {
                    LG.failAttempt[message.member.id] = 1
                }

                if (LG.failAttempt[message.member.id] === 2) {
                    LG.lg_game_channels.village_lg.send(
                        `<@${message.member.id}>, la commande pour voter est **vote <numéro du joueur>**.\n` +
                        `Voici la liste des joueurs :\n\n${lg_functions.get_player_list(client, message).string}`
                    ).catch(err => reject(err));

                    // Reset fail attempt counter
                    LG.failAttempt[message.member.id] = 0;
                }
            }

            if (vote_fct.check_vote(client, message) && vote_fct.all_players_voted(client, message)) {

                maire_vote_msg_collector.stop();
                LG.failAttempt = {};

                let userVoted = message.guild.members.find('id', LG.vote_data.result);

                if (userVoted) {

                    send.message_to_village(client, message, `${userVoted.displayName} est élu(e) Maire du village !`)
                        .then(msg => {

                        console.log(msg);
                        resolve(userVoted.id);

                    }).catch(err => reject(err));

                }

            }

        });

    }),

};
