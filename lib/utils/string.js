'use strict';

const camelCase = require('lodash.camelcase');
const kebabCase = require('lodash.kebabcase');
const snakeCase = require('lodash.snakecase');
const startCase = require('lodash.startcase');

module.exports.kebabCase = kebabCase;

module.exports.camelCase = camelCase;

module.exports.titleCase = startCase;

/**
 * @param {string} string
 * @returns {string} The string in UpperCamelCase
 */
module.exports.upperCamelCase = string => string && (string[0].toUpperCase() + camelCase(string.substring(1)));

/**
 * @param {string} string
 * @returns {string} The string in UPPER_SNAKE_CASE
 */
module.exports.upperSnakeCase = string => snakeCase(string).toUpperCase();
