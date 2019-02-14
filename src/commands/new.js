let botData = require("../BotData.js");
const LoupGarou = require("../lg/lg_game");

exports.run = (LGBot, message, args) => {


	new LoupGarou.Game(LGBot, message).launch();
   

};
