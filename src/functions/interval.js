const UTC_LOCAL_TIMESHIFT = 1;

class Scheduler {

    /**
     * This class allows to schedule task or remind something
     */
    constructor(timeString, func, args) {

        this.date = null;
        this.time = null;
        this.func = null;
        this.arguments = null;

        this.secondInterval = null;
        this.minuteInterval = null;
        this.hourInterval = null;
        this.dayInterval = null;
        this.weekInterval = null;
        this.monthInterval = null;
        this.yearInterval = null;

        if (timeString) {

            let timeData = timeString.split('|');
            let dateData = timeData[0].split('/');
            let tData = timeData[1].split(':');

            this.date = {
                day: parseInt(dateData[0]),
                month: parseInt(dateData[1]),
                year: parseInt(dateData[2]),
            };

            this.time = {
                minute: parseInt(tData[1]),
                hour: parseInt(tData[0]),
            };

        }

        if (func) {
            this.func = func;
            this.arguments = args;
            this.findMinuteInterval();
        }

    }

    checkTime(date) {

        console.log(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getUTCHours() + UTC_LOCAL_TIMESHIFT}:${date.getMinutes()}`);
        console.log(`${this.date.day}/${this.date.month}/${this.date.year} ${this.time.hour}:${this.time.minute}\n`);

        if (this.date.day === date.getDate() &&
            this.date.month === date.getMonth() + 1 &&
            this.date.year === date.getFullYear()) {

            if (this.time.hour === date.getUTCHours() + UTC_LOCAL_TIMESHIFT &&
                this.time.minute === date.getMinutes()) {

                return true;

            }

        }

        return false;

    }

    clearIntervals() {

        if (this.secondInterval) clearInterval(this.secondInterval);
        if (this.minuteInterval) clearInterval(this.minuteInterval);
        if (this.hourInterval) clearInterval(this.hourInterval);
        if (this.dayInterval) clearInterval(this.dayInterval);
        if (this.weekInterval) clearInterval(this.weekInterval);
        if (this.monthInterval) clearInterval(this.monthInterval);
        if (this.yearInterval) clearInterval(this.yearInterval);

    }

    findMinuteInterval() {

        if (this.checkTime(new Date())) {
            if (this.func) {
                this.clearIntervals();
                this.func(this.arguments);
            }
        } else {

            this.secondInterval = setInterval(() => {

                let date = new Date();
                let UTCseconds = date.getUTCSeconds();
                let seconds = date.getSeconds();

                if (this.checkTime(new Date())) {
                    if (this.func) {
                        this.clearIntervals();
                        this.func(this.arguments);
                    }
                } else if (UTCseconds === 0 || seconds === 0) {
                    this.findHourInterval();
                }

            }, 1000);

        }

    }

    findHourInterval() {

        clearInterval(this.secondInterval);
        if (this.checkTime(new Date())) {
            if (this.func) {
                this.clearIntervals();
                this.func(this.arguments);
            }
        } else {
            this.minuteInterval = setInterval(() => {

                let date = new Date();
                let UTCminute = date.getUTCMinutes();
                let minute = date.getMinutes();

                if (this.checkTime(date)) {
                    if (this.func) {
                        this.clearIntervals();
                        this.func(this.arguments);
                    }
                } else if (UTCminute === 0 || minute === 0) {
                    this.findDayInterval();
                }

            }, 60000);
        }

    }

    findDayInterval() {

        clearInterval(this.minuteInterval);
        this.checkTime(new Date());
        this.hourInterval = setInterval(() => {

            let date = new Date();
            let hour = (date.getUTCHours() + UTC_LOCAL_TIMESHIFT) % 24;

            this.checkTime(date);

            if (hour === 0) {
                this.findWeekInterval();
            }

        }, 60000 * 60);

    }

    findWeekInterval() {

        clearInterval(this.hourInterval);
        this.dayInterval = setInterval(() => {

        })

    }

}

let test = new Scheduler("25/09/2018|17:19", () => {
    console.log("Done.");
});
