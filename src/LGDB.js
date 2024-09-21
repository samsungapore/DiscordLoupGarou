const Discord = require('discord.js');

class LGDB extends Discord.Client {
    constructor(clientOptions) {
        super(clientOptions);
        this.Settings = new Map();
        this.LG = new Map();
        this.commands = new Discord.Collection();
    }

    init() {
        this.initCommands();

        return this;
    }

    initCommands() {
        const fs = require('graceful-fs');
        for (const file of fs.readdirSync('./src/commands')) {
            const command = require(`./commands/${file}`);
            this.commands.set(command.name, command);
        }

        return this;
    }

    /**
     * @brief Persists all data of the Bot to database files
     */
    persist() {
        persistLGData(this.LG);
    }
}

// import sqlite3 promisified
const {AsyncDatabase} = require("promised-sqlite3");

async function persistLGData(LG = new Map()) {
    console.info(`Persisting LG data to the database. of ${JSON.stringify(LG)}`)

    for (let [key, value] of Array.from(LG.entries())) {
        const db = await AsyncDatabase.open(`./data/lg/${key}.db`);

        await db.run(`CREATE TABLE IF NOT EXISTS lg (
            running BOOLEAN NOT NULL DEFAULT false,
            game TEXT DEFAULT null,
            canRun TEXT DEFAULT '[]',
            stemming TEXT DEFAULT null
        )`);

        await db.run(
            `INSERT INTO lg (running, game, canRun, stemming) VALUES (?, ?, ?, ?)`,
            [value.running, value.game, JSON.stringify(value.canRun), value.stemming]
        );

        await db.close();
    }
}

module.exports = {
    LGDB,
    persistFunctions: {
        persistLGData
    }
};
