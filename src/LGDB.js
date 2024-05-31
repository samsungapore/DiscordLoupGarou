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

const sqlite3 = require('sqlite3').verbose();

function persistLGData(LG = new Map()) {
    console.info(`Persisting LG data to the database. of ${JSON.stringify(LG)}`)

    Array.from(LG.entries()).forEach(([key, value]) => {
        let db = new sqlite3.Database(`./data/lg/${key}.db`, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log(`Connected to the ${key} database.`);
        });

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS lg (
                    id TEXT PRIMARY KEY NOT NULL,
                    running INTEGER DEFAULT 0,
                    game TEXT DEFAULT NULL,
                    stemming TEXT DEFAULT NULL,
                )`);


        });

        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log(`Connection to the ${key} database closed.`);
        });
    });
}

module.exports = {
    LGDB,
    persistFunctions: {
        persistLGData
    }
};
