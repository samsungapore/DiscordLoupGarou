/**
 * Fonction utilitaire pour envoyer un embed dans un channel
 */
async function sendEmbed(channel, embed) {
    return await channel.send({
        embeds: [embed.embed]
    });
}

/**
 * Fonction utilitaire qui permet d'éditer un message
 */
async function editMessage(message, embed) {
    return await message.edit({
        embeds: [embed.embed]
    });
}

module.exports = {
    sendEmbed,
    editMessage
}

