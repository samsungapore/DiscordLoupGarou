let timeToString = (minutes) => {

    let hours = minutes / 60;

    let seconds = (minutes * 60) % 60;

    let timestring = `${(minutes % 60).toFixed()}m`;
    if (hours >= 1) {
        timestring = `${hours.toFixed()}h${timestring}`;
    }

    timestring = `${timestring}m${seconds}s`;

    return timestring;

};

module.exports = timeToString;