'use strict';

const toCamelCase = require('lodash.camelcase');
const startCase = require('lodash.startcase');

module.exports = str => startCase(toCamelCase(str)).split(' ')
	.join('');
