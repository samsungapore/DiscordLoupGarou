const BotData = require("../BotData");
const MessageEmbed = require("discord.js").MessageEmbed;

let shuffle_array = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

module.exports = {

    shuffle_array,

    get_random_index: function (array) {
        if (array.length === 1) return (0);
        return (Math.floor(Math.random() * array.length));
    },

    get_random_in_array: (array) => {
        if (array.length === 1) return (array[0]);
        return (array[Math.floor(Math.random() * array.length)]);
    }

};
