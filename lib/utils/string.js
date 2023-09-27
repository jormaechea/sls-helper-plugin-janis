'use strict';

const camelCase = require('lodash.camelcase');
const snakeCase = require('lodash.snakecase');
const startCase = require('lodash.startcase');

module.exports.kebabCase = string => {
	return string.trim()
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/\W/g, m => (/[À-ž]/.test(m) ? m : '-'))
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')
		.toLowerCase();
};

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
