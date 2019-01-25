const send = require("../message_sending");
const day = require("./day");
const renard = require("../roles/personnages/renard").renard;
const frereSoeurs = require("../roles/personnages/frereSoeurs").frereSoeurs;
const joueurFlute = require("../roles/nouvelle_lune/joueurDeFlute").joueurFlute;
const infectPereDesLoups = require("../roles/personnages/infectPereDesLoups").infectPereDesLoups;
const enfantSauvage = require("../roles/personnages/enfantSauvage").enfantSauvage;
const sorciere = require("../roles/thiercelieux/sorciere").sorciere;
const salvateur = require("../roles/nouvelle_lune/salvateur").salvateur;
const loupsGarous = require("../roles/thiercelieux/loupGarou").loupsGarous;
const quit_game_on_error = require("./game_ending").quit_game_on_error;
const voyante = require("../roles/thiercelieux/voyante").voyante;
const cupidon = require("../roles/thiercelieux/cupidon").cupidon;
const voleur = require("../roles/thiercelieux/voleur").voleur;

function first_night(client, message) {
    return new Promise((resolve, reject) => {

        let gSettings = client.guilds_settings.get(message.guild.id);

        LG.firstnight = false;

        Promise.all([voleur(client, message), cupidon(client, message), enfantSauvage(client, message)]).then(() => {

            regular_night(client, message).then(() => resolve(null)).catch(err => reject(err));

        }).catch(err => reject(err));

    });
}

function regular_night(client, message) {
    return new Promise((resolve, reject) => {

        Promise.all([salvateur(client, message), joueurFlute(client, message), loupsGarous(client, message)])
            .then(() => {

                let siblingsPromise = frereSoeurs(client, message);

                Promise.all([infectPereDesLoups(client, message), voyante(client, message)])
                    .then(() => {

                        // Night passed successfully
                        Promise.all([siblingsPromise, renard(client, message), sorciere(client, message)])
                            .then(() => resolve(null)).catch(err => reject(err));

                    }).catch(err => reject(err));

            }).catch(err => reject(err));

    });
}

module.exports = {

    night: (client, message) => {
        const lg_functions = require('../lg_functions.js');
        let g_set = client.guilds_settings.get(message.guild.id);

        lg_functions.switch_permissions(client, message, 'night').then(() => {
            send.message_to_village(client, message, ':milky_way: Le village s\'endort.').then(() => {

                let nightPromise = [];

                if (g_set.LG.firstnight) {
                    nightPromise.push(first_night(client, message));
                } else {
                    nightPromise.push(regular_night(client, message));
                }

                Promise.all(nightPromise).then(() => {
                    g_set.LG.turn += 1;
                    day.day(client, message);
                }).catch(err => quit_game_on_error(client, err, message, "Erreur rencontrée lors de la nuit"));

            }).catch(console.error);
        }).catch(err => quit_game_on_error(client, err, message, "Erreur rencontrée lors du switch des permissions de nuit"));

    },

};
