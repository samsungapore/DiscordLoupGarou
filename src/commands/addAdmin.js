let botData = require("../BotData.js");
const {checkPermissions} = require("../utils/permission");

let addAdmins = (LGBot, message) => {

    if (checkPermissions(message.member,"BAN_MEMBERS")) {

        let Settings = LGBot.Settings.get(message.guild.id);

        if (!Settings) {
            LGBot.Settings.set(message.guild.id, botData.Settings);
            Settings = LGBot.Settings.get(message.guild.id);
        }

        Settings.Admins.push(message.mentions.members.array().map(member => member.id));
        Settings.Admins = [...new Set(Settings.Admins)];

        LGBot.Settings.set(message.guild.id, Settings)

    } else {
        message.reply("Tu n'as pas la permission")
    }

};

module.exports = {
    name: 'addAdmins',
    description: 'ajouter des admins au bot LG, capables de stopper des parties de force',
    execute(LGBot, message) {
        addAdmins(LGBot, message);
    },
};
