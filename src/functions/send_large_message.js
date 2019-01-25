module.exports = {

    send_large_message: async function (message, data, code=false) {

        if (data.length < 1990) {
            if (code) {
                if (!data.startsWith("```")) {
                    data = "```js\n" + data;
                }
                if (!data.endsWith("```")) {
                    data += "\n```";
                }
            }
            message.channel.send(data).catch(console.error);
        } else {

            while (data.length > 0) {

                let tmp = data.slice(0, 1990);

                await message.channel.send("```js\n" + tmp + "\n```");

                data = data.slice(1990);

            }

        }

    }

};
