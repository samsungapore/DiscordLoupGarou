/*
 *  Copyright (C) 2018  Samuel Radat
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const winston = require('winston');
require('winston-daily-rotate-file');
const {join} = require('path');
const fs = require('fs');

if (!process.env.LOG_PATH) {
    require('./env');
}

if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

let transport = new (winston.transports.DailyRotateFile)({
    filename: join(process.env.LOG_PATH, '/%DATE%.log'),
    datePattern: 'YYYY_MM_DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

winston.configure({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf((info) => {
            const {
                timestamp, level, message, ...args
            } = info;

            const ts = timestamp.slice(0, 19).replace('T', ' ');
            return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
        }),
    ),
    transports: [
        transport,
        new winston.transports.Console({level: 'debug'}),
    ],
});

module.exports = winston;
