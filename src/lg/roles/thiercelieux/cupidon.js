const send = require("../../message_sending");
const Villageois = require("../baseRole").Villageois;
const get_player_list = require("../../lg_functions").get_player_list;
const VillageoisVote = require("../../lg_vote.js").VillageoisVote;

class Cupidon extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Cupidon";

        this.id1 = undefined;
        this.id2 = undefined;

        this.dmChannel = undefined;

        return this;
    }

    getChoice(configuration) {
        return new Promise((resolve, reject) => {

            this.GameConfiguration = configuration;

            this.member.createDM().then(privateChannel => {

                this.dmChannel = privateChannel;

                return new VillageoisVote(
                    "Veuillez choisir le premier élu",
                    this.GameConfiguration,
                    20000, this.dmChannel, 1
                ).everyone();

            }).then(outcome => {

                if (outcome.length === 0) {

                    this.dmChannel.send("Tu n'as pas fait ton choix, ton tour est terminé").catch(console.error);
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "**Cupidon** se rendort."
                    ).then(() => resolve(true)).catch(err => reject(err));
                    return;

                } else if (outcome.length === 1) {

                    this.id1 = outcome.shift();

                } else {
                    reject("Plusieurs votes ont été fait pour cupidon, situation impossible");
                }

                return new VillageoisVote(
                    "Veuillez choisir son/sa partenaire",
                    this.GameConfiguration,
                    20000, this.dmChannel, 1
                ).everyone([this.id1]);

            }).then(outcome => {

                if (outcome.length === 0) {

                    this.dmChannel.send("Tu n'as pas fait ton choix, ton tour est terminé").catch(console.error);
                    this.GameConfiguration.channelsHandler.sendMessageToVillage(
                        "**Cupidon** se rendort."
                    ).then(() => resolve(true)).catch(err => reject(err));

                } else if (outcome.length === 1) {

                    this.id2 = outcome.shift();

                    resolve([this.id1, this.id2]);

                } else {
                    reject("Plusieurs votes ont été fait pour cupidon, situation impossible");
                }

            }).catch(err => reject(err));

        });
    }

}

module.exports = {Cupidon,

    cupidon: (client, message) => {
        return new Promise((resolve, reject) => {
            let gSettings = client.guilds_settings.get(message.guild.id);

            if (LG.role_players_id.Cupidon.length === 0) {
                resolve(null);
            }

            send.message_to_village(client, message, 'J\'appelle **Cupidon** qui va désigner **les Amoureux**.')
                .catch(err => reject(err));

            let cupidonId = LG.role_players_id.Cupidon[0];
            let cupidon = LG.players[cupidonId];

            let playerList = get_player_list(client, message);
            // Contains the string with all the players
            let playersListString = playerList.string;
            // Contains id list
            let players_array = playerList.array;

            // Create private message channel discussion with the cupidon player
            cupidon.member_object.createDM().then(chan => {

                chan.send(`Qui seront les heureux élus ? Entre deux numéros.\n*Tu as deux minute pour choisir*\n${playersListString}\n\n**Exemple :**\n\n**vote 2 3**`)
                    .catch(err => reject(err));

                let cupidonTimeoutWarningMsg = setTimeout(() => {
                    chan.send('Il te reste 20 secondes pour effectuer ton choix').catch(err => reject(err));
                }, 100000);

                const cupidon_answer = chan.createMessageCollector(m => m.author.id === cupidonId, {time: 120000});

                LG.message_collector_list.push(cupidon_answer);

                cupidon_answer.on('collect', message => {

                    let answer = message.content.split(/ +/g);

                    if (answer.length !== 3) {
                        chan.send('Entrer 2 numéros de cette ' +
                            'façon : **vote 2 3**').catch(err => reject(err));
                        return;
                    }

                    if (isNaN(parseInt(answer[1])) || isNaN(parseInt(answer[2]))) {
                        chan.send('Entre un nombre.').catch(err => reject(err));
                        return;
                    }

                    if (!gSettings.players[players_array[parseInt(answer[1]) - 1]] ||
                        !gSettings.players[players_array[parseInt(answer[2]) - 1]]) {

                        chan.send(`Les numéros vont de ${players_array.length - players_array.length + 1} à ${players_array.length}.`)
                            .catch(err => reject(err));
                        return;
                    }

                    let amoureux1 = gSettings.players[players_array[parseInt(answer[1]) - 1]];
                    let amoureux2 = gSettings.players[players_array[parseInt(answer[2]) - 1]];

                    amoureux1.amoureux = amoureux2.id;
                    amoureux2.amoureux = amoureux1.id;

                    console.log(`${amoureux1.display_name} est amoureux avec ${amoureux2.display_name}`);
                    chan.send(`${amoureux1.display_name} est en couple avec ${amoureux2.display_name}.`)
                        .catch(err => reject(err));

                    amoureux1.member_object.send(`Tu es en couple avec ${amoureux2.display_name}. Survivez.`)
                        .catch(err => reject(err));
                    amoureux2.member_object.send(`Tu es en couple avec ${amoureux1.display_name}. Survivez.`)
                        .catch(err => reject(err));

                    // This triggers the "end" event.
                    cupidon_answer.stop('Cupidon made his choice');
                });

                // This event is triggered when the "stop" method is called, meaning cupidon made his choice.
                cupidon_answer.on('end', () => {

                    if (LG.quitting_game) {
                        return;
                    }

                    LG.timeout_list.splice(
                        LG.timeout_list.indexOf(cupidonTimeoutWarningMsg)
                    );

                    clearTimeout(cupidonTimeoutWarningMsg);

                    LG.message_collector_list
                        .splice(LG.message_collector_list.indexOf(cupidon_answer));

                    send.message_to_village(client, message, '**Cupidon** a fait son choix. Il se rendort.')
                        .catch(err => reject(err));

                    resolve(null);
                });

            }).catch(err => reject(err));

        });

    },

};
