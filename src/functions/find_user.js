let find_user = (client, name) => {
    name = name.toLowerCase().trim();
    let result = null;
    client.guilds.cache.array().forEach(guild => {

        guild.members.cache.array().forEach(member => {

            if (member.nickname && member.nickname.toLowerCase().trim().includes(name)) {
                result = member;
            } else if (member.user.username.toLowerCase().trim().includes(name)) {
                result = member;
            }

        });

    });

    return result;
};

module.exports = {find_user};
