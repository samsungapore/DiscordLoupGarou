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

const {existsSync, writeFileSync} = require('fs');
const {join} = require('path');

/**
 * Checking if the .env file exists
 * If not, indicates user that a default .env file was created.
 */
const envFilePath = join(process.cwd(), '.env');

if (!existsSync(envFilePath)) {

  const defaultData = [
    'LOG_PATH=./logs',
  ];

  console.warn(
    'No ".env" file was found. A ".env" file was thus created with' +
    ' default values required by the program',
  );

  try {
    writeFileSync(envFilePath, defaultData.join('\n'));
  } catch (e) {
    console.error(e);
    throw Error(
      '".env" file could not be created. Please create one at your' +
      ' root directory according to the example file named ".env.example"'
    );
  }
}

/**
 * Retrieving existing environment values stored in the .env file at the
 * root directory
 */
const existingEnvValues = require('dotenv').config().parsed;

/**
 * Here are the default values for the environment if the following
 * {keys: values} are not specified in the .env file.
 * @type {{LOG_PATH: string}}
 */
const defaultEnvValues = {
  LOG_PATH: './logs',
};

/**
 * Assigns the default values in priority, and if existing values were
 * retrieved, it thus overwrites the default ones.
 */
Object.assign(process.env, defaultEnvValues, existingEnvValues);
