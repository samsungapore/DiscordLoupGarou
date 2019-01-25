const lg_var = require("../lg_var");
const functions = require("../../functions/parsing_functions");

function send_roles_to_players(client, message) {
    return new Promise((resolve, reject) => {
        let LG = client.LG.get(message.guild.id);

        let messageSending = [];
        Object.keys(LG.players).forEach(id => {

            messageSending.push(LG.players[id].member_object.send(lg_var.roles_desc[LG.players[id]['role']]));

        });

        Promise.all(messageSending).then(messages => {
            resolve(messages);
        }).catch(err => reject(err));
    });
}

function roles_complete(client, message, role_var) {

    let complete = true;

    Object.keys(role_var).forEach(role => {

        if (role_var[role] !== 0) {
            complete = false;
        }

    });

    console.log(`Role complete ${complete}`);
    return complete;
}

function cleanRoleArray(role_array) {
    let cleaned = Object();
    Object.keys(role_array).forEach(role => {

        if (role_array[role] !== 0)
            cleaned[role] = role_array[role];

    });
    return cleaned;
}

function set_role(client, message, role_array_index, id) {
    return new Promise((resolve, reject) => {
        const lg_var = require('../lg_var.js');
        const LG = client.LG.get(message.guild.id);

        let role_array = LG.role_conf[role_array_index];
        let roles_name = Object.keys(cleanRoleArray(role_array));

        if (roles_name.length === 0) {
            reject("in set_role, role_name is empty");
        }

        let aleatoire = Math.floor(Math.random() * roles_name.length);
        let random_role = roles_name[aleatoire];

        let permissionSpecialRolesPromises = [];
        if (Object.keys(lg_var.channel_reserved_roles).includes(random_role)) {

            if (random_role === 'LoupGarou') {

                permissionSpecialRolesPromises.push(
                    LG.lg_game_channels[lg_var.channel_reserved_roles[random_role]].overwritePermissions(
                        LG.players[id].member_object,
                        {
                            'VIEW_CHANNEL': true,
                            'READ_MESSAGES': true,
                            'SEND_MESSAGES': false
                        }
                    )
                );

            } else if (random_role === 'PetiteFille') {

                permissionSpecialRolesPromises
                    .push(LG.lg_game_channels.petite_fille_lg
                        .overwritePermissions(LG.players[id].member_object,
                            {
                                'VIEW_CHANNEL': true,
                                'READ_MESSAGE': true,
                                'SEND_MESSAGES': false
                            }
                        )
                    );

            }

        }

        LG.players[id].role = random_role;

        if (random_role === 'Sorciere') {
            LG.players[id].potions = {
                vie: 1,
                poison: 1
            }
        }

        LG.role_players_id[random_role].push(id);
        LG.role_conf[role_array_index][random_role] -= 1;

        Promise.all(permissionSpecialRolesPromises).then(() => {
            resolve(`Role ${LG.players[id].role} given to ${LG.players[id].display_name}`);
        }).catch(err => reject(err));
    });

}

function remove_role(client, message, role_name) {
    return new Promise((resolve, reject) => {

        message.guild.roles.forEach(role_n => {
            if (role_n.name.toLowerCase() === role_name.toLowerCase())
                role_n.delete().then(() => resolve(null)).catch(err => reject(err));
        });

    });
}

let find_available_role = (client, message, player_id) => new Promise((resolve, reject) => {
    const LG = client.LG.get(message.guild.id);

    let i = 0;
    let role_conf = LG.role_conf;
    while (i < role_conf.length) {
        if (!roles_complete(client, message, role_conf[i])) {
            set_role(client, message, i, player_id).then((resolved) => {
                console.log(resolved);
                return resolve(null);
            }).catch(err => reject(err));
            break;
        }
        i += 1;
    }
});

module.exports = {

    remove_role,

    create_roles: (client, message) => new Promise((resolve, reject) => {

        const lg_var = require('../lg_var.js');
        const LG = client.LG.get(message.guild.id);

        // Deleting roles created
        Object.keys(LG.lg_game_roles).forEach(role_name => {

            remove_role(client, message, role_name).catch(console.error);

        });


        let rolePromises = [];

        // Creating necessary roles for the game
        Object.keys(LG.lg_game_roles).forEach(role_name => {

            // creating the role 'role_name'
            rolePromises.push(message.guild.createRole({
                name: role_name,
                color: LG.lg_game_roles[role_name].color,
                hoist: true
            }));

        });

        Promise.all(rolePromises).then((roleArray) => {

            roleArray.forEach(role => {

                console.log(`Created role ${role.name}`);

                if (role.name === 'Mastermind') {
                    message.guild.me.addRole(role).catch(console.error);
                }

                LG.lg_game_roles[role.name].object = role;

            });

            resolve(null);


        }).catch(onrejected => {

            console.error(onrejected);

            reject("Erreur rencontrée lors de la création des rôles, veuillez vérifier les permissions du bot " +
                "quant à la création de rôles et de channels. Ces rôles et channels seront détruits à la fin " +
                "de la partie");

        });


    }),

    assign_roles: (client, message) => new Promise((resolve, reject) => {
        const LG = client.LG.get(message.guild.id);

        let roleAttributionPromises = [];
        functions.shuffle_array(Object.keys(LG.players)).forEach(player_id => {
            roleAttributionPromises.push(find_available_role(client, message, player_id));
        });

        Promise.all(roleAttributionPromises).then(() => {

            send_roles_to_players(client, message).then(() => {
                resolve(null);
            }).catch(err => reject(err));

        }).catch(err => reject(err));
    }),

    remove_role_to_player: (message, member, role_name, client) => {
        const LG = client.LG.get(message.guild.id);

        let role = LG.lg_game_roles[role_name];

        if (!role) return;

        member.removeRole(role).catch(console.error);
    },

    /**
     * retrieve additional roles
     * @param client
     * @param message
     * @param number of role to retrieve
     */
    get_additional_roles: (client, message, number) => new Promise((resolve, reject) => {

        const LG = client.LG.get(message.guild.id);
        const lg_functions = require('../lg_functions.js');

        let additionalRoles = [];

        LG.role_conf.forEach(role_block => {
            if (!roles_complete(client, message, role_block)) {

                let role_object = cleanRoleArray(role_block);
                let role_array = Object.keys(role_object);

                additionalRoles.push(role_array[lg_functions.get_random_index(role_array)]);


                number -= 1;
                if (number === 0) {
                    resolve(additionalRoles);
                }

            }
        });

        resolve(additionalRoles);
    }),

};
