// BEFORE RUNNING:
const {google} = require('googleapis');
let sheets = google.sheets('v4');
const gSheet = require('../BotData').GoogleSheet;

class Musics {

    constructor(data) {

        this._data = data;

        this.categories = this._data.shift();
        this.categories.shift();

        this.currKey = null;
        this.data = {

        };

        this.gameData = {

        };

        this.parse();
        return this;
    }

    get musics() {
        return this.data;
    }

    get games() {
        return this.gameData;
    }

    parse() {

        this._data.forEach(element => {

            if (element.length === 0) return;

            if (element[0].length > 0) {
                this.currKey = element[0];
                this.data[this.currKey] = {};
            }

            element.shift();

            element.forEach((e, i) => {
                if (!this.data[this.currKey][this.categories[i]]) {
                    this.data[this.currKey][this.categories[i]] = [];
                }
                this.data[this.currKey][this.categories[i]].push(e);
            });

        });

        Object.keys(this.data).forEach(sequence => {

            Object.keys(this.data[sequence]).forEach(game => {

                if (!this.gameData[game]) {
                    this.gameData[game] = {
                        name: game
                    };
                }

                if (!this.gameData[game][sequence]) {
                    this.gameData[game][sequence] = [];
                }

                this.gameData[game][sequence] = this.gameData[game][sequence].concat(this.data[sequence][game]).filter(element => element.length > 0);

            });

        });

        this.cleanObj();
        return this;
    }

    cleanObj() {
        delete this.categories;
        delete this.currKey;
        delete this._data;
    }

}

let getMusics = () => new Promise((resolve, reject) => {

    authorize(function (authClient) {
        let request = {
            // The ID of the spreadsheet to retrieve data from.
            spreadsheetId: gSheet.spreadsheetId,  // TODO: Update placeholder value.

            // The A1 notation of the values to retrieve.
            range: 'A1:Z60',  // TODO: Update placeholder value.

            auth: authClient,
        };

        sheets.spreadsheets.values.get(request, function (err, response) {
            if (err) {
                reject(err);
                return;
            }

            resolve(new Musics(response.data.values));
        });
    });

});

function authorize(callback) {
    // TODO: Change placeholder below to generate authentication credentials. See
    // https://developers.google.com/sheets/quickstart/nodejs#step_3_set_up_the_sample
    //
    // Authorize using one of the following scopes:
    //   'https://www.googleapis.com/auth/drive'
    //   'https://www.googleapis.com/auth/drive.file'
    //   'https://www.googleapis.com/auth/drive.readonly'
    //   'https://www.googleapis.com/auth/spreadsheets'
    //   'https://www.googleapis.com/auth/spreadsheets.readonly'
    let authClient = gSheet.apiKey;

    if (authClient == null) {
        console.log('authentication failed');
        return;
    }
    callback(authClient);
}

module.exports = getMusics;