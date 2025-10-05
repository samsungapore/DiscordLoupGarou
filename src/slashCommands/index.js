const {Collection} = require('discord.js');
const fs = require('graceful-fs');

function loadSlashCommands(client) {
    const commands = new Collection();
    const dir = './src/slashCommands';
    for (const file of fs.readdirSync(dir)) {
        if (file === 'index.js') continue;
        const cmd = require(`./${file}`);
        if (cmd && cmd.name && typeof cmd.execute === 'function') {
            commands.set(cmd.name, cmd);
        }
    }
    client.slashCommands = commands;
    return client;
}

async function registerSlashCommands(client) {
    if (!client.application) return;
    const existing = await client.application.commands.fetch();
    const toEnsure = Array.from(client.slashCommands?.values() || []);
    for (const cmd of toEnsure) {
        const def = {
            name: cmd.name,
            description: cmd.description,
            options: cmd.options || [],
            dm_permission: !!cmd.dm_permission,
        };
        if (!Array.from(existing.values()).find(c => c.name === def.name)) {
            await client.application.commands.create(def);
        }
    }
}

module.exports = { loadSlashCommands, registerSlashCommands };
