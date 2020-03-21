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
        guild.members.cache.array().forEach(member => {

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
     * Get a random index from array
     * @param array
     * @returns {number}
     */
    get_random_index: array => {
        if (array.length === 1) return (0);
        return (Math.floor(Math.random() * array.length));
    },

};
