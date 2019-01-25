const death = require("../../game_core/death");
const send = require("../../message_sending");
const vote = require("../../game_core/vote");
let RichEmbed = require('discord.js').RichEmbed;

/**
 *  Les voici, les vils méchants ! Vous devrez leur demander, après qu'ils se soient concertés, qui ont
 *  ils décidé de tuer pour cette nuit. Une fois cette décision prise, elle est irrévocable ;
 *  les Loups se rendorment alors jusqu'au lever du jour...
 *  //todo: Attention, les loups ne peuvent pas tuer un autre loup, qu'il soit blanc ou non.
 *  //todo: Ne pas appeler le loup blanc la première nuit
 * @param client
 * @param message
 */
let loupsGarous = (client, message) => new Promise((resolve, reject) => {
    const lg_functions = require('../../lg_functions.js');
    const lg_var = require('../../lg_var.js');
    let g_set = client.guilds_settings.get(message.guild.id);

    if (g_set.LG.role_players_id.LoupGarou.length === 0) {
        death.print_supposed_deaths(client, message);
        g_set.LG.revote = false;
        resolve(null);
        return;
    }

    send.message_to_village(client, message, "J'appelle les **Loups-garou**.")
        .catch(err => reject(err));

    let lg_channel = g_set.LG.lg_game_channels.loups_garou_lg;

    // String
    let player_list = lg_functions.get_player_list(client, message, g_set.LG.role_players_id.LoupGarou.concat(
        g_set.LG.role_players_id.LoupBlanc
    ));

    if (g_set.LG.turn === 1) {
        lg_channel.send("Prenez garde à la petite fille ~").catch(console.error);
    }

    lg_channel.send(
        new RichEmbed().setColor(lg_var.botColor).setAuthor("Loups Garous", lg_var.roles_img.LoupGarou)
            .addField("Bonsoir les Loups-Garou.", `Tapez **vote <numéro>** pour choisir une personne à dévorer.\n\n${player_list.string}`)
            .setFooter("Vous disposez de 2 minutes pour voter")
    ).catch(console.error);

    let msg_timeout = setTimeout(() => {
        lg_channel.send("Il vous reste 20 secondes pour voter.").catch(console.error);
    }, 100000);

    g_set.LG.lg_vote = lg_channel.createMessageCollector(m => m.author.id !== message.guild.me.id, {time: 120000});

    g_set.LG.DEATHS_ID = [];
    vote.clear_lg_vote(client, message);
    vote.reset_vote_data(client, message);
    vote.memset_vote_data(client, message, player_list.array);

    g_set.LG.lg_vote.on('collect', message => {

        let msg_content = message.content;

        if (msg_content) {
            msg_content = msg_content.toLowerCase().trim();
        }

        if (!message.content) {
            console.log('Empty message.');
        } else if (msg_content.startsWith('vote ') && msg_content.split(/ +/g)[0] === 'vote') {

            let answer = msg_content.split(/ +/g);
            answer.shift();

            if (answer.length > 1) {
                lg_channel.send('Tu ne peux voter que pour une personne. Entrer un numéro.')
                    .catch(console.error);
                return;
            }

            if (isNaN(parseInt(answer[0]))) {
                lg_channel.send('Entre un nombre.');
                return;
            }

            let index = player_list.array[parseInt(answer[0]) - 1];
            let target = g_set.LG.players[index];
            let sender = g_set.LG.players[message.author.id];

            if (!target) {

                lg_channel.send(`Les numéros vont de ${player_list.array.length - player_list.array.length + 1} à ${player_list.array.length}.`)
                    .catch(console.error);
                return;
            }

            if (sender.has_voted) {

                lg_channel.send(`Tu as déjà voté, ${sender.display_name}`).catch(console.error);

            } else {

                g_set.LG.vote_data.votes[target.id] += 1;
                sender.has_voted = true;
                console.log(`${message.member.displayName} a voté pour ${target.display_name}.`);

                vote.showVoteStatus(client, message, player_list.array, lg_channel).catch(console.error);

                /*
                    Checking if all lg voted
                 */
                if (vote.all_lg_voted(client, message)) {

                    if (!vote.check_vote(client, message)) {
                        g_set.LG.vote_retry_nb += 1;

                        if (g_set.LG.vote_retry_nb < 3) {

                            lg_channel.send(`Le vote est nul ou vous n'avez pas voté, recommençons. Il reste ${3 - g_set.LG.vote_retry_nb} essai(s), après quoi une personne au hasard sera choisie.`);
                            g_set.LG.revote = true;
                            g_set.LG.lg_vote.stop();

                        } else {

                            lg_channel.send(`Le vote est nul ou vous n'avez pas voté, une personne va être exécutée au hasard parmi les villageois.`);

                            death.compute_deaths(client, message);

                            vote.clear_lg_vote(client, message);
                            g_set.LG.lg_vote.stop();

                        }

                    } else {

                        death.compute_deaths(client, message);

                        vote.clear_lg_vote(client, message);

                        g_set.LG.lg_vote.stop();

                    }

                }

            }

        }

    });

    g_set.LG.lg_vote.on('end', () => {

        if (g_set.revote) {
            g_set.revote = false;

            clearTimeout(msg_timeout);
            return (loupsGarous(client, message));


        } else {

            send.message_to_village(client, message, 'Les **Loups-garou** se rendorment.');
            //todo: loup blanc
            death.print_supposed_deaths(client, message);
            clearTimeout(msg_timeout);
            vote.clear_players_vote(client, message);
            resolve(null);
        }

    });
});


module.exports = {

    loupsGarous

};