class Wait {

    static seconds(seconds) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 1000 * seconds);
        });
    }

    static minutes(minutes) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 60000 * minutes);
        });
    }

    static hours(hours) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 60000 * 60 * hours);
        });
    }

    static days(days) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 60000 * 60 * 24 * days);
        });
    }

    static weeks(weeks) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 60000 * 60 * 24 * 7 * weeks);
        });
    }

    static months(months) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 60000 * 60 * 24 * 30 * months);
        });
    }

    static years(years) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(true), 60000 * 60 * 24 * 365 * years);
        });
    }

}

module.exports = {Wait};
