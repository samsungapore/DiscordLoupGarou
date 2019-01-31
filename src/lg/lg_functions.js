const lg_var = require("./lg_var");
const RichEmbed = require("discord.js").RichEmbed;

module.exports = {

    /**
     * Fid
     * @param name
     * @param guild
     * @returns {GuildMember}
     */
    find_user: (name, guild) => {
        let res = null;

        // iterates over all members
        guild.members.array().forEach(member => {

            /*
            toLowerCase() method converts all characters into lower case
            (https://www.w3schools.com/jsref/jsref_tolowercase.asp)

            trim() method removes whitespace at the beginning and the end of a string
            (https://www.w3schools.com/jsref/jsref_trim_string.asp)

            this way the comparison will be more handy :)
            */

            if (member.nickname) {
                // compare with nickname
                if (member.nickname.toLowerCase().trim().includes(name.toLowerCase().trim())) {
                    res = member
                }
            }

            // compare with username
            if (member.user.username.toLowerCase().trim().includes(name.toLowerCase().trim())) {
                res = member;
            }


        });

        // If we can't find the user, return null
        return res;
    },

    /**
     * Switch permissions for night and day
     * @param client
     * @param message
     * @param time "day" or "night"
     * @returns {Promise<null>}
     */
    switch_permissions: (client, message, time) => new Promise((resolve, reject) => {

        const lg_var = require('./lg_var.js');
        let gSettings = client.guilds_settings.get(message.guild.id);

        let joueur_role = LG.lg_game_roles.JoueurLG.object;

        let permissionPromises = [];

        permissionPromises.push(LG.lg_game_channels.village_lg.overwritePermissions(
            joueur_role, lg_var.permission.JoueurLG.village_lg[time]
        ));

        LG.role_players_id.LoupGarou.concat(
            LG.role_players_id.LoupBlanc
        ).forEach(id => {

            console.log(`Changing permission lg of ${LG.players[id].display_name} which is ${LG.players[id].role}`);

            permissionPromises.push(LG.lg_game_channels.loups_garou_lg.overwritePermissions(
                LG.players[id].member_object, lg_var.permission.LoupGarou.loups_garous_lg[time]
            ));
        });

        Promise.all(permissionPromises).then(() => {
            resolve(null);
        }).catch(err => reject(err));

    }),

    /**
     * Returns players list
     * @param client
     * @param message
     * @param exceptions_ids Array
     * @returns {*[players : String, players_array : Array]}
     */
    get_player_list: (client, message, exceptions_ids) => {
        let gSettings = client.guilds_settings.get(message.guild.id);
        let players = '';

        // Contains id
        let players_array = [];
        let i = 1;

        console.log(LG.players);
        Object.keys(LG.players).forEach(id => {

            if (LG.players[id].alive) {

                if (exceptions_ids !== undefined) {
                    let continue_foreach = false;
                    exceptions_ids.forEach(exception_id => {
                        if (exception_id === id) {
                            continue_foreach = true;
                        }
                    });
                    if (continue_foreach) {
                        return;
                    }
                }

                players += `**${i}** - *${LG.players[id].display_name}*\n`;
                players_array.push(id);
                i += 1;

            }

        });

        return {string: players, array: players_array};
    },

    /**
     * Get a random index from array
     * @param array
     * @returns {number}
     */
    get_random_index: array => {
        if (array.length === 1) return (0);
        return (Math.floor(Math.random() * array.length));
    },

};
