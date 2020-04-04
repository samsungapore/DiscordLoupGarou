const { ShardingManager } = require('discord.js');
const BotData = require("./src/BotData");
const manager = new ShardingManager('./src/discordlgbot.js', { token: BotData.BotValues.botToken });

manager.spawn().then(shards => {
    console.log(`Currently ${shards.size} shards active`);
}).catch(console.error);

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));