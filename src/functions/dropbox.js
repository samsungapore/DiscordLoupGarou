require('isomorphic-fetch');
const fs = require("graceful-fs"); // or another library of choice.
let Dropbox = require('dropbox').Dropbox;
const bot_values = require('../BotData.js');
let dbx = new Dropbox({accessToken: bot_values.bot_values.dropbox_token});

function list_folder(path = '/danganronpa 2 traduction fr/sdse2_shared_data/data01/jp/script') {
    dbx.filesListFolder({
        path: path,
        recursive: true,
    }).then(function (response) {
        if (response.has_more) {
            dbx.filesListFolderContinue({cursor: response.cursor}).then(response => {
            }).catch(console.error);
        }
    }).catch(function (error) {
        console.error(error);
    });
}

class Revision {
    constructor() {
        this.modifier_name = null;
        this.fileName = null;
        this.date = null;
        this.data = null;
    }
}

function get_file_promise(path, callback, trad = true) {
    fs.readFile(path, 'utf16le', (err, data) => {
        if (err)
            return callback(err, null);
        if (trad && !data.includes('<text lang')) {
            fs.readFile(path, 'utf8', (err, data) => {
                if (err)
                    return callback(err, null);
                callback(null, data);
            });
            return;
        }
        callback(null, data);
    });
}

function get_file_data(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

let get_revisions_stats = (path) => new Promise((resolve, reject) => {

    dbx.filesListRevisions({path: path}).then(response => {

        let promises = [];

        response.entries.forEach(revision => {
            promises.push(dbx.usersGetAccount({account_id: revision.sharing_info.modified_by}));
        });

        return Promise.all(promises);
    }).then(accounts => {

        let revlist = [];

        accounts.forEach(account => {
            let rev = new Revision();

            rev.modifier_name = {
                name: account.name.display_name,
                email: account.email
            };
            revlist.push(rev);
        });

        resolve(revlist);
    }).catch(err => {
        reject(err);
    });

});

/**
 * This function gets all the revisions of a dropbox file from its path in dropbox directory for DR2 files
 * @param path : String path from root directory of dropbox folder
 * @param callback : function function when get_revisions is done with those parameters => (err, revisions)
 */
function get_revisions(path, callback) {

    let run = async (path) => {
        let revisions = await dbx.filesListRevisions({path: path});
        let allRevisions = [];
        let revision;
        for (let i = 0 ; i < revisions.entries.length ; i++) {
            revision = revisions.entries[i];
            let account = await dbx.usersGetAccount({account_id: revision.sharing_info.modified_by});
            let file_path = "../.." + revision.path_display.replace("sdse2_shared_data", "SDSE2_Shared_Data");

            let downloadedFile = await dbx.filesDownload({path: file_path.substr(5), rev: revision.rev});

            let data = downloadedFile.fileBinary.toString();

            let rev = new Revision();
            let frenchText;
            let englishText;
            if (data.indexOf("<text lang=\"en\">") === -1) {
                data = Buffer.from(data, 'utf8').toString('utf16le');
            }
            if (data.includes("<text lang=\"en\">")) {
                frenchText = data.substring(data.indexOf("<text lang=\"en\">") + "<text lang=\"en\">".length, data.indexOf("</text>")).replace(/&lt;CLT \d\d&gt;/g, "").replace(/&lt;CLT&gt;/g, "");
                englishText = data.substring(data.indexOf("<text lang=\"ja\">") + "<text lang=\"ja\">".length, data.indexOf("</text>", data.indexOf("</text>") + "</text>".length)).replace(/&lt;CLT \d\d&gt;/g, "").replace(/&lt;CLT&gt;/g, "");
            } else {
                frenchText = "";
                englishText = data.substring(data.indexOf("<text lang=\"ja\">") + "<text lang=\"ja\">".length, data.indexOf("</text>")).replace(/&lt;CLT \d\d&gt;/g, "").replace(/&lt;CLT&gt;/g, "");
            }
            let japaneseText = data.substring(data.indexOf("<comment>") + "<comment>".length, data.indexOf("</comment>")).replace(/&lt;CLT \d\d&gt;/g, "").replace(/&lt;CLT&gt;/g, "");
            rev.data = `*Français :* **${frenchText}**\n*Anglais :* ${englishText}\n*Japonais :* ${japaneseText}`;
            rev.modifier_name = {
                name: account.name.display_name,
                email: account.email
            };
            rev.fileName = revision.name;
            let tab = revision.client_modified.split('-');
            tab.splice(2, 1);
            rev.date = `${revision.client_modified.split('-')[2].substr(0, 2)}/${tab[1]}/${tab[0]}`;
            allRevisions.push(rev);
        }
        return allRevisions;
    };

    run(path).then(allRevisions => {
        callback(allRevisions);
    }).catch(console.error);
}

function get_file_events() {


}

function getrevsPromise(file_path) {
    return new Promise((resolve, reject) => {
        get_revisions(file_path, (err, revisions) => {
            if (err) {
                reject(err);
            }
            resolve(revisions);
        });
    });
}

module.exports = {
    get_revisions, get_file_data, getrevsPromise, get_revisions_stats
};