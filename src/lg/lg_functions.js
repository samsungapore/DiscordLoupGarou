const lg_var = require("./lg_var");
const RichEmbed = require("discord.js").RichEmbed;

module.exports = {

    get_admin_strlist: (client, message) => {

        let gSettings = client.guilds_settings.get(message.guild.id);

        let admins = '';
        gSettings.guild_admins.forEach(admin_id => {
            admins += `<@${admin_id}>, `;
        });
        admins = admins.slice(0, admins.length - 2);

        return admins
    },

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

    show_participants: (client, message) => new Promise((resolve, reject) => {
        let gSettings = client.guilds_settings.get(message.guild.id);

        let participants = new RichEmbed()
            .setColor(7419530)
            .setAuthor("Participants au LG", lg_var.roles_img.LoupGarou)


        let player_list_id = Object.keys(LG.players);
        let mem;
        let i = 0;

        player_list_id.forEach(id => {
            i += 1;
            if (i === 25) {
                message.channel.send(participants).catch(err => reject(err));
                participants = new RichEmbed()
                    .setColor(7419530)
                    .setAuthor("Participants au LG", lg_var.roles_img.LoupGarou);
                i = 0;
            }
            mem = LG.players[id];
            participants.addField(mem.display_name, `*${lg_var.memberStatus[mem.member_object.presence.status]}*`, true);
        });

        message.channel.send(participants).then(msg => {
            resolve(msg);
        }).catch(err => reject(err));

    }),

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
