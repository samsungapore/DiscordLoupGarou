let errCatcher = (channel, err) => {
	console.error(err);
	channel.send("```" + err + "```").catch(console.error);
}

module.exports = {errCatcher};
