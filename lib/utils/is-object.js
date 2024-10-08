'use strict';

module.exports.isObject = value => value && typeof value === 'object' && !Array.isArray(value);
