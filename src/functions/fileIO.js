const fs = require('graceful-fs');

class FileIO {

    constructor(path) {
        this.path = path;
        this.data = null;
        this.encoding = null;
    }

    isValidFile() {
        return fs.existsSync(this.path);
    }

    checkEncoding(encoding) {
        if (encoding === undefined) {
            encoding = "utf8";
        }
        this.encoding = encoding;
    }

    writeFile(data, encoding) {
        return new Promise((resolve, reject) => {

            this.checkEncoding(encoding);

            fs.writeFile(path, data, this.encoding, (err) => {
                if (err) {
                    return reject(err);
                }
                this.data = data;
                return resolve(true);
            });
        });
    }

    appendToFile(data, encoding) {
        return new Promise((resolve, reject) => {

            this.checkEncoding(encoding);

            fs.appendFile(path, data, this.encoding, (err) => {
                if (err) {
                    return reject(err);
                }
                this.data = data;
                return resolve(true);
            });
        });
    }

    readFile(encoding) {
        return new Promise((resolve, reject) => {
            this.checkEncoding(encoding);
            fs.readFile(path, this.encoding, (err, data) => {
                if (err) {
                    return reject(err);
                }
                this.data = data;
                return resolve(data);
            });
        });
    }

    readFileLines(encoding) {
        return new Promise((resolve, reject) => {
            this.readFile(encoding).then(data => {
                let array = data.split("\n");
                return resolve(array);
            }).catch(err => reject(err))
        });
    }
}

module.exports = {FileIO};
