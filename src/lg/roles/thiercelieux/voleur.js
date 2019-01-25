const lg_var = require("../../lg_var");
const send = require("../../message_sending");
const Villageois = require("../baseRole").Villageois;
const get_random_index = require("../../lg_functions").get_random_index;
const get_additional_roles = require("../../init/role_setup").get_additional_roles;

class Voleur extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Voleur";

        return this;
    }

}

function print_role_choice(client, message, voleurChannel) {
    return new Promise((resolve, reject) => {
        get_additional_roles(client, message, 2).then(additionalRoles => {

            voleurChannel.send(`Tu es le voleur. Tu as le choix d'échanger ton rôle de voleur
                considéré comme villageois avec deux carte. Tu ne dois en choisir qu'une seule.\n\n
                Voici les deux cartes :\n`).catch(err => reject(err));

            let rolesChoicePromises = [];

            rolesChoicePromises.push(voleurChannel.send(lg_var.roles_desc[additionalRoles[0]]));
            rolesChoicePromises.push(voleurChannel.send(lg_var.roles_desc[additionalRoles[1]]));

            Promise.all(rolesChoicePromises).then(() => {

                resolve([voleurChannel, additionalRoles]);

            }).catch(err => reject(err));

        }).catch(err => reject(err));
    })
}

function get_voleur_choice(client, message, voleur, voleurChannel, additionalRoles) {
    return new Promise((resolve, reject) => {
        let gSettings = client.guilds_settings.get(message.guild.id);
        let doubleLg = false;


        if (additionalRoles[0] === "LoupGarou" && additionalRoles[1] === "LoupGarou") {
            doubleLg = true;
        }


        let guide_message = '';
        if (doubleLg) {
            guide_message = `"**vote 1**" : ${additionalRoles[0]}\n
                            "**vote 2**" : ${additionalRoles[1]}`;
        } else {
            guide_message = `"**vote 1**" : ${additionalRoles[0]}\n
                            "**vote 2**" : ${additionalRoles[1]}\n
                            "**vote 3**" : Je garde mon rôle.`;
        }


        voleurChannel.send(guide_message).catch(err => reject(err));


        let voleurChoice = voleurChannel.createMessageCollector(
            m => m.author.id === voleur.id,
            {time: 120000} // 120 seconds timer
        );
        LG.message_collector_list.push(voleurChoice);


        let voleurTimeoutWarningMsg = setTimeout(() => {
            voleurChannel.send("Il reste 20 secondes avant la fin du vote").catch(err => reject(err));
        }, 100000);
        LG.timeout_list.push(voleurTimeoutWarningMsg);

        let roleChosen = null;

        voleurChoice.on('collect', msg => {
            let m = msg.content;

            if (m.startsWith("vote ")) {

                let answer = parseInt(m.slice("vote ".length));
                let boundLG = {
                    false: 3,
                    true: 2
                };

                if (isNaN(answer) || answer < 1 || answer > boundLG[doubleLg]) {
                    voleurChannel.send(`Veuillez entrer un chiffre entre 1 et ${boundLG[doubleLg]}`)
                        .catch(err => reject(err));
                    return;
                }

                if (answer === 3) {
                    voleurChoice.stop('User keeps his role');
                    return;
                }

                roleChosen = additionalRoles[answer - 1];
                let r_players_id = LG.role_players_id.Voleur;
                // Backend changes of roles
                LG.players[voleur.id].role = roleChosen;
                LG.role_players_id.Voleur.splice(r_players_id.indexOf(voleur.id), 1);
                LG.role_players_id[roleChosen].push(voleur.id);

                voleurChoice.stop('User trade his role');


            } else {

                voleurChannel.send(`rappel des commandes pour voter :\n` + guide_message).catch(err => reject(err));

            }

        });

        voleurChoice.on('end', collected => {
            if (LG.quitting_game) {
                return;
            }
            if (!roleChosen) {
                roleChosen = additionalRoles[get_random_index(additionalRoles)];
                let r_players_id = LG.role_players_id.Voleur;
                // Backend changes of roles
                LG.players[voleur.id].role = roleChosen;
                LG.role_players_id.Voleur.splice(r_players_id.indexOf(voleur.id), 1);
                LG.role_players_id[roleChosen].push(voleur.id);
                console.log(`Voleur (${voleur.display_name}) sent ${collected.size} messages to the mastermind.`);
                resolve(null);
            }

            console.log(`Voleur (${voleur.display_name}) sent ${collected.size} messages to the mastermind.`);
            LG.timeout_list.splice(LG.timeout_list.indexOf(voleurTimeoutWarningMsg));
            clearTimeout(voleurTimeoutWarningMsg);
            resolve(null);
        });

    });
}

/**
 * Step 1: create DM
 * Step 2: print role choice
 * Step 3: get user input of choice
 * @param client
 * @param message
 * @returns {Promise<*[]>}
 */
function voleur_main_function(client, message) {
    return new Promise((resolve, reject) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        let voleurID = LG.role_players_id.Voleur[0];
        let voleur = LG.players[voleurID];

        voleur.member_object.createDM().then(voleurChannel => resolve(voleurChannel)).catch(err => reject(err));

    }).then(voleurChannel => print_role_choice(client, message, voleurChannel))
        .then(([voleurChannel, additionalRoles]) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        let voleurID = LG.role_players_id.Voleur[0];
        let voleur = LG.players[voleurID];

        return get_voleur_choice(client, message, voleur, voleurChannel, additionalRoles);

    });
}

module.exports = {Voleur,

    voleur: (client, message) => new Promise((resolve, reject) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        // If no voleur, skip
        if (LG.role_players_id.Voleur.length === 0) {
            resolve(null);
        }

        send.message_to_village(client, message, "Le voleur se réveille.").catch(err => reject(err));

        voleur_main_function(client, message).then(() => {

            resolve(null);

        }).catch(err => reject(err));

    }),

};
