'use strict';

/*
 * quote.js
 *
 * (C) Copyright 2018
 * Author: Samuel Radat <samuel.radat@epitech.eu>
 */

const request = require('request');
const cheerio = require('cheerio');

request('http://g-langue-de-bois.fr/patronal/discours_patronal.php', (error, response, html) => {

    if (error) return console.error(error);

    const $ = cheerio.load(html);

    let value = $('#page');

    console.log(response);

});
