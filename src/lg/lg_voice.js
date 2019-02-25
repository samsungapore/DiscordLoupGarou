const get_random_in_array = require("../functions/parsing_functions").get_random_in_array;
const fs = require('fs').promises;
const path = require('path');
const ytdl = require('ytdl-core');

class VoiceHandler {

    constructor(voiceChannel) {

        this.voiceChannel = voiceChannel ? voiceChannel : null;
        this.voiceConnection = null;

        this.bgm = null;
        this.announcement = null;

        this.musics = {
            firstDay: [
                'https://www.youtube.com/watch?v=totQBPwi4wo&feature=youtu.be',
                'https://www.youtube.com/watch?v=x-oKZDNMy4Y',
                'https://www.youtube.com/watch?v=_8Y4Hb2ZtQE',
            ],
            day: [
                'https://www.youtube.com/watch?v=9rLLKXf3jQc',
                'https://www.youtube.com/watch?v=x-oKZDNMy4Y',
                'https://www.youtube.com/watch?v=_8Y4Hb2ZtQE'
            ],
            night: [
                'https://www.youtube.com/watch?v=MBJKivjfLmo',
                'https://www.youtube.com/watch?v=d1onQJtO_bw',
                'https://www.youtube.com/watch?v=LG3E4hqI9Dw',
                'https://www.youtube.com/watch?v=dNX4oGT_FVg',
                'https://www.youtube.com/watch?v=n8HPtslZubw'
            ]
        };

        this.handlerType = "default";

        return this;
    }

    get type() {
        return this.handlerType;
    }

    async destroy() {
        this.bgm.end();
        this.announcement.end();

        this.voiceConnection.disconnect();
        await this.voiceChannel.leave();
        return this;
    }

    static dispatcherAvailable(dispatcher) {
        return dispatcher && !dispatcher.destroyed;
    }

    async stopBGM() {
        if (VoiceHandler.dispatcherAvailable(this.bgm)) {
            this.bgm.end();
        }
    }

    async pauseBGM() {
        if (VoiceHandler.dispatcherAvailable(this.bgm)) {
            this.bgm.pause();
        }
    }

    async resumeBGM() {
        if (VoiceHandler.dispatcherAvailable(this.bgm)) {
            this.bgm.resume();
        }
    }

    async join() {
        if (this.voiceChannel) this.voiceConnection = await this.voiceChannel.join();
    }

    playSoundAndWait(path, vol) {
        return new Promise((resolve, reject) => {

            const stream = ytdl(path, { filter: 'audioonly' });

            stream.on('error', (err) => {
                console.error(err);
            });

            let dispatcher = this.voiceConnection.playStream(stream, {volume: vol});

            dispatcher.on('error', (err) => reject(err));
            dispatcher.on('end', () => resolve(this));

        });
    }

    async playSound(path, vol) {

        const stream = ytdl(path, { filter: 'audioonly' });

        stream.on('error', (err) => {
            console.error(err);
        });

        return this.voiceConnection.playStream(stream, {volume: vol});

    }

    async playFirstDayBGM() {

        this.bgm = await this.playSound(get_random_in_array(this.musics.firstDay), 0.1);

        return this;
    }

    async playNightBGM() {

        this.bgm = await this.playSound(get_random_in_array(this.musics.night), 0.1);

        return this;
    }

    async playDayBGM() {

        this.announcement = await this.playSound(get_random_in_array(this.musics.day), 0.7);

        return this;
    }

}

class HigurashiVoiceHandler extends VoiceHandler {

    constructor(voiceChannel) {
        super(voiceChannel);

        this.handlerType = "higurashi";

        this.musics = {
            day: [
                'https://www.youtube.com/watch?v=MBJKivjfLmo'
            ],
            night: [
                'https://www.youtube.com/watch?v=MBJKivjfLmo'
            ]
        };

        return this;
    }

}

module.exports = {VoiceHandler, HigurashiVoiceHandler};
