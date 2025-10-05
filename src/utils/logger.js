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

const defaultLogDir = './logs';
const LOG_DIR = process.env.LOG_PATH || defaultLogDir;
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, {recursive: true});
}

const fileTransport = new (winston.transports.DailyRotateFile)({
    filename: join(LOG_DIR, '/%DATE%.log'),
    datePattern: 'YYYY_MM_DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.uncolorize(),
        winston.format.json()
    )
});

const consoleTransport = new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf((info) => {
            const {timestamp, level, message, ...meta} = info;
            const ts = String(timestamp).slice(0, 19).replace('T', ' ');
            const kv = [];
            for (const [k, v] of Object.entries(meta)) {
                if (v === undefined || v === null) continue;
                if (typeof v === 'object') kv.push(`${k}=${JSON.stringify(v)}`);
                else kv.push(`${k}=${v}`);
            }
            return `${ts} [${level}]: ${message}${kv.length ? ' ' + kv.join(' ') : ''}`;
        }),
    )
});

winston.configure({
    level: process.env.LOG_LEVEL || 'info',
    transports: [consoleTransport, fileTransport],
});

module.exports = winston;
