const exec = require('child_process').exec;

const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
};


let processIsRunning = (processName) => new Promise((resolve, reject) => {

    isRunning(processName, (status) => {
        resolve(status);
    });

});

let runDropbox = () => new Promise((resolve, reject) => {
    console.log("trying to run dropbox");
    exec('\"C:\\Program Files (x86)\\Dropbox\\Client\\Dropbox.exe\"').unref();
    resolve(true);
});

module.exports = {processIsRunning, runDropbox};
