let fs = require('graceful-fs');
let path = require('path');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

let readFolder = (folder) => new Promise((resolve, reject) => {
    fs.readdir(folder, "utf8", (err, files) => {
        if (err) return reject(err);
        resolve(files);
    });
});

class Walk {

    constructor(dir, fileExtension) {

        this.dir = dir;
        this.fileExtension = fileExtension;

        return this;
    }

    on() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.dir, (error, files) => {
                if (error) {
                    return reject(error);
                }

                Promise.all(files.map((file) => {
                    return new Promise((resolve, reject) => {
                        const filepath = path.join(this.dir, file);
                        fs.stat(filepath, (error, stats) => {
                            if (error) {
                                return reject(error);
                            }
                            if (stats.isDirectory()) {
                                this.dir = filepath;
                                new Walk(filepath, this.fileExtension).on().then(resolve).catch(console.error);
                            } else if (stats.isFile()) {
                                if (this.fileExtension) {
                                    if (filepath.endsWith(this.fileExtension)) {
                                        resolve(filepath);
                                    } else {
                                        resolve(null);
                                    }
                                } else {
                                    resolve(filepath);
                                }
                            }
                        });
                    });
                })).then((foldersContents) => {
                    resolve(foldersContents.reduce((all, folderContents) => all.concat(folderContents), []));
                }).catch(console.error);
            });
        });
    }

}

module.exports = {Walk, asyncForEach, readFolder};
