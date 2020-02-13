const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const Wait = require('../functions/wait').Wait;


class VoiceHandler {

    constructor(voiceChannel, musicMode) {

        this.voiceChannel = voiceChannel ? voiceChannel : null;
        this.voiceConnection = null;

        this.dispatcher = null;
        this.bgmTime = null;
        this.bgmLink = null;

        this.bgmPaused = false;

        this.musics = {
            firstDay: musicMode ? musicMode["Musiques premier jour"] : null,
            day: musicMode ? musicMode["Musiques jour"] : null,
            night: musicMode ? musicMode["Musiques nuit"] : null
        };

        this.handlerType = musicMode ? musicMode.name : null;

        return this;
    }

    get type() {
        return this.handlerType;
    }

    async destroy() {
        if (this.dispatcher) this.dispatcher.end();

        this.voiceConnection.disconnect();
        await this.voiceChannel.leave();
        return this;
    }

    static dispatcherAvailable(dispatcher) {
        return dispatcher;
    }

    async stopBGM() {
        if (VoiceHandler.dispatcherAvailable(this.dispatcher)) {
            this.dispatcher.end();
            await Wait.seconds(2.5);
        }
    }

    pauseBGM() {
        return new Promise((resolve, reject) => {
            if (VoiceHandler.dispatcherAvailable(this.dispatcher)) {
                this.bgmTime = this.dispatcher.time / 1000;
                this.dispatcher.end();
                this.bgmPaused = true;
                Wait.seconds(2).then(() => resolve(this));
            } else {
                resolve(this);
            }
        });
    }

    async resumeBGM() {

        this.dispatcher = null;
        this.dispatcher = await this.playYTSound(this.bgmLink, 0.1);
        this.bgmPaused = false;
        await Wait.seconds(1);

    }

    join() {
        return new Promise((resolve, reject) => {
            if (this.voiceChannel) {
                this.voiceChannel.join().then(voiceConnection => {

                    this.voiceConnection = voiceConnection;

                    resolve(this);

                }).catch(err => reject(err));
            } else {
                resolve(this);
            }
        });
    }

    async setupEvents() {

        this.voiceConnection.on('debug', message => console.debug(message));
        this.voiceConnection.on('error', error => console.error(error));
        this.voiceConnection.on('failed', err => console.error(err));
        this.voiceConnection.on('reconnecting', () => console.info('Voice connection reconnecting'));

    }

    playYTSoundAndWait(path, vol) {
        return new Promise((resolve, reject) => {

            const stream = ytdl(path, {filter: 'audioonly'});

            stream.on('error', (err) => {
                console.error(err);
            });

            this.dispatcher = this.voiceConnection.playStream(stream, {volume: vol});

            this.dispatcher.on('error', (err) => reject(err));
            this.dispatcher.on('end', () => resolve(this));
            this.dispatcher.on('debug', (msg) => console.debug(msg));

        });
    }

    playYTSound(path, vol, momentum) {

        return new Promise((resolve, reject) => {
            const stream = ytdl(path, {filter: 'audioonly'});

            stream.on('error', (err) => {
                console.error(err);
            });

            this.dispatcher = this.voiceConnection.playStream(stream, {volume: vol, seek: (momentum ? momentum : 0)});

            this.dispatcher.on('start', () => {
                resolve(this.dispatcher);
            });
            this.dispatcher.on('error', (err) => reject(err));
            this.dispatcher.on('debug', (msg) => console.debug(msg));
        });

    }

    playSoundAndWait(path, vol) {
        return new Promise((resolve, reject) => {

            this.dispatcher = this.voiceConnection.playFile(path, {volume: vol});

            this.dispatcher.on('error', (err) => reject(err));
            this.dispatcher.on('end', () => Wait.seconds(1).then(() => resolve(this)));
            this.dispatcher.on('debug', (msg) => console.debug(msg));

        });
    }

    async playSound(path, vol) {
        return new Promise((resolve, reject) => {
            this.dispatcher = this.voiceConnection.playFile(path, {volume: vol});

            this.dispatcher.on('start', () => Wait.seconds(1).then(() => resolve(this.dispatcher)));
            this.dispatcher.on('error', (err) => reject(err));
            this.dispatcher.on('debug', (msg) => console.debug(msg));
        });
    }

    async playFirstDayBGM() {

        this.bgmLink = get_random_in_array(this.musics.firstDay);

        this.dispatcher = await this.playYTSound(this.bgmLink, 0.1);

        return this;
    }

    async playNightBGM() {

        this.bgmLink = get_random_in_array(this.musics.night);

        this.dispatcher = await this.playYTSound(this.bgmLink, 0.1);

        return this;
    }

    async playDayBGM() {

        this.bgmLink = get_random_in_array(this.musics.day);

        this.dispatcher = await this.playYTSound(this.bgmLink, 0.1);

        return this;
    }

    async playAnnouncement(path) {

        if (require('fs').existsSync(path)) {

            this.announcementOngoing = true;
            await this.pauseBGM();
            await this.playSoundAndWait(path, 0.7);
            this.dispatcher = null;
            await this.resumeBGM();
            this.announcementOngoing = false;

        }

        return this;

    }

    async announceRole(roleName, reveil) {

        let file = '';

        if (reveil) {
            file = path.join(__dirname, `../../assets/${this.type}/announcements/${roleName}_reveil.mp3`);
        } else {
            file = path.join(__dirname, `../../assets/${this.type}/announcements/${roleName}_dort.mp3`);
        }

        await this.playAnnouncement(file);

        return this;
    }

    async announceDayBegin() {

        const link = path.join(__dirname, `../../assets/${this.type}/announcements/lejourseleve.mp3`);

        await this.playAnnouncement(link);
        return this;
    }

    async announceNightSoon() {
        const link = path.join(__dirname, `../../assets/${this.type}/announcements/lanuitvabientot.mp3`);
        await this.playAnnouncement(link);
        return this;
    }

    async announceVoteCapitaine() {
        const link = path.join(__dirname, `../../assets/${this.type}/announcements/lesvillageoissereunissent.mp3`);
        await this.playAnnouncement(link);
        return this;
    }

}

module.exports = {VoiceHandler};
