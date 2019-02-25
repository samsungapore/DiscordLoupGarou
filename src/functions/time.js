let timeToString = (minutes) => {

    let hours = minutes / 60;

    let seconds = (minutes * 60) % 60;

    if (minutes < 1) {
        minutes = 0;
    }

    let timestring = `${(minutes % 60).toFixed()}`;

    if (hours >= 1) {
        timestring = `${hours.toFixed()}h${timestring}`;
    }

    timestring = `${timestring}m${seconds}s`;

    return timestring;

};

module.exports = timeToString;