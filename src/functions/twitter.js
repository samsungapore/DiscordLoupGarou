let Twitter = require('twitter');
const BotData = require("../BotData");
let RichEmbed = require("discord.js").RichEmbed;

let initTwitterListener = (channel, kazuhiro) => {

    let client = new Twitter({
        consumer_key: BotData.twitter_api.consumer_key,
        consumer_secret: BotData.twitter_api.consumer_secret,
        access_token_key: BotData.twitter_api.access_token_key,
        access_token_secret: BotData.twitter_api.access_token_secret
    });

    client.stream('statuses/filter', {track: 'danganronpa'},  function(stream) {
        stream.on('data', function(tweet) {

            if (tweet.user.screen_name === "danganronpawiki") {

                let msg = new RichEmbed()
                    .setAuthor(tweet.user.name, tweet.user.profile_image_url)
                    .setDescription(tweet.text)
                    .setFooter(tweet.created_at)
                    .setColor(BotData.bot_values.botColor);

                if ("media" in tweet.entities) {
                    tweet.entities.media.forEach(media => {
                        msg.setImage(media.media_url);
                    });
                }

                channel.send(msg).catch(console.error);
            }

        });

        stream.on('error', function(error) {
            console.error(error);
        });
    });

};

module.exports = {initTwitterListener};
