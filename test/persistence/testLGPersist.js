const {
    persistFunctions: {
        persistLGData
    }
} = require('../../src/LGDB');
const BotData = require('../../src/BotData');
const assert = require("assert");
const fs = require('fs');


// let's test the persistLGData function with mocha

describe('persistLGData', function () {
    before(function () {
        // runs before all tests in this block
        // create the data folder
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
        }

        // create the lg folder
        if (!fs.existsSync('./data/lg')) {
            fs.mkdirSync('./data/lg');
        }

        // remove the files in lg folder
        const files = fs.readdirSync('./data/lg');
        for (const file of files) {
            fs.unlinkSync(`./data/lg/${file}`);
        }
    });

    it('should persist the LG data to the database', function () {
        // test code here

        const LG = new Map(
            [
                ['test', BotData.LG]
            ]
        );
        persistLGData(LG);

        assert.equal(LG.size, 1);

        // check if file exists
        const path = './data/lg/test.db';
        assert.ok(fs.existsSync(path));
    });

    after(function () {
        // runs after all tests in this block
        // remove the files in lg folder
        const files = fs.readdirSync('./data/lg');
        for (const file of files) {
            fs.unlinkSync(`./data/lg/${file}`);
        }
    });
});
