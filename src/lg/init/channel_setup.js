module.exports = {

    channel_exists: (client, message) => {
        const gSettings = client.guilds_settings.get(message.guild.id);
        const channelArray = Object.keys(LG.lg_game_channels);

        let hasCategory = false;
        let i = 0;
        channelArray.forEach(channelName => {
            client.channels.array().forEach(channel => {
                if (channel.name === channelName) {
                    LG.lg_game_channels[channel.name] = channel;
                    i += 1;
                }
                if (channel.name.toLowerCase() === "loup-garou-de-thiercelieux") {
                    LG.categoryChan = channel;
                    hasCategory = true
                }
            });
        });

        let categoryPromise = null;
        if (!hasCategory) {
            categoryPromise = message.guild.createChannel("Loup-Garou-De-Thiercelieux", 'category');
        }

        return {
            condition: i === channelArray.length,
            categoryChan: categoryPromise
        };
    },

    setup_permissions: (client, message, categoryChan) => new Promise((resolve, reject) => {
        const lg_var = require("../lg_var");
        const gSettings = client.guilds_settings.get(message.guild.id);
        let channelsCreated = [
            LG.lg_game_channels.village_lg,
            LG.lg_game_channels.loups_garou_lg,
            LG.lg_game_channels.paradis_lg,
            LG.lg_game_channels.petite_fille_lg
        ];

        if (categoryChan) {
            categoryChan.then(categChan => {
                const channel_setup = require('./channel_setup');
                channelsCreated.forEach(chan => {
                    chan.setParent(categChan).catch(console.error);
                });
                return channel_setup.setup_permissions(client, message, null);
            })
        } else {
            if (channelsCreated.includes(null)) {
                console.error("Some channel are null");
                reject("Some channel are null");
            }

            let permissionsPromises = [];

            channelsCreated.forEach(channel => {

                console.log(`${channel.name} created`);
                channel.setParent(LG.categoryChan).catch(err => reject(err));

                LG.lg_game_channels[channel.name] = channel;

                let has_permission = true;

                Object.keys(lg_var.permission).forEach(role => {
                    if (!lg_var.permission[role][channel.name] && !lg_var.bypass_roles.includes(role)) {
                        has_permission = false;
                    }
                });

                if (!has_permission) {
                    return;
                }

                // SETTING PERMISSIONS ON CHANNEL

                // Roles created by the lg game
                let joueur_role = LG.lg_game_roles.JoueurLG.object;
                let mort_role = LG.lg_game_roles.MortLG.object;
                let mastermind_role = LG.lg_game_roles.Mastermind.object;

                // Will always be this name
                let everyone_role = message.guild.roles.find('name', '@everyone');

                if (channel.name === 'village_lg') {
                    console.log("Setting LG permissions on village channel");
                    permissionsPromises.push(channel.overwritePermissions(joueur_role, lg_var.permission.JoueurLG[channel.name].day));
                } else {
                    console.log("Setting LG permissions on " + channel.name + " channel");
                    permissionsPromises.push(channel.overwritePermissions(joueur_role, lg_var.permission.JoueurLG[channel.name]));
                }

                console.log(`Setting Mastermind permission on ${channel.name} channel`);
                permissionsPromises.push(channel.overwritePermissions(mastermind_role, lg_var.permission.Mastermind[channel.name]));
                console.log(`Setting MortLG permission on ${channel.name} channel`);
                permissionsPromises.push(channel.overwritePermissions(mort_role, lg_var.permission.MortLG[channel.name]));
                console.log(`Setting JoueurLG permission on ${channel.name} channel`);
                permissionsPromises.push(channel.overwritePermissions(everyone_role, lg_var.permission.everyone[channel.name]));

            });

            Promise.all(permissionsPromises).then(() => {

                console.log("Channels setup done");
                resolve(null);

            }).catch(err => reject(err));
        }
    }),

    setup_channels: (client, message) => new Promise((resolve, reject) => {
        const lg_functions = require('../lg_functions.js');
        const lg_var = require('../lg_var.js');
        const gSettings = client.guilds_settings.get(message.guild.id);


        let channelDeleterPromises = [];
        message.guild.channels.array().forEach(channel => {

            Object.keys(LG.lg_game_channels).forEach(channame => {
                if (channame === channel.name) {
                    channelDeleterPromises.push(channel.delete());
                }
            })

        });

        Promise.all(channelDeleterPromises).then(() => {


            let channelsPromises = [];

            message.guild.createChannel("Loup-Garou-De-Thiercelieux", 'category').then(categoryChan => {

                LG.categoryChan = categoryChan;

                //Creating necessary channels for the game
                Object.keys(LG.lg_game_channels).forEach(channel_name => {

                    channelsPromises.push(message.guild.createChannel(channel_name, 'text'));

                });

                Promise.all(channelsPromises).then(channelsCreated => {

                    let permissionsPromises = [];

                    channelsCreated.forEach(channel => {

                        console.log(`${channel.name} created`);
                        channel.setParent(categoryChan).catch(err => reject(err));

                        LG.lg_game_channels[channel.name] = channel;

                        // SETTING PERMISSIONS ON CHANNEL

                        // Roles created by the lg game
                        let joueur_role = LG.lg_game_roles.JoueurLG.object;
                        let mort_role = LG.lg_game_roles.MortLG.object;

                        // Will always be this name
                        let everyone_role = message.guild.roles.find('name', '@everyone');

                        if (channel.name === 'village_lg') {
                            console.log("Setting LG permissions on village channel");
                            permissionsPromises.push(channel.overwritePermissions(joueur_role, lg_var.permission.JoueurLG[channel.name].day));
                        } else {
                            console.log("Setting LG permissions on " + channel.name + " channel");
                            permissionsPromises.push(channel.overwritePermissions(joueur_role, lg_var.permission.JoueurLG[channel.name]));
                        }

                        console.log(`Setting MortLG permission on ${channel.name} channel`);
                        permissionsPromises.push(channel.overwritePermissions(mort_role, lg_var.permission.MortLG[channel.name]));
                        console.log(`Setting JoueurLG permission on ${channel.name} channel`);
                        permissionsPromises.push(channel.overwritePermissions(everyone_role, lg_var.permission.everyone[channel.name]));

                    });

                    Promise.all(permissionsPromises).then(() => {

                        console.log("Channels setup done");
                        resolve(null);

                    }).catch(err => reject(err));

                }).catch(err => reject(err));

            });


        }).catch(err => reject(err));



    }),

};
