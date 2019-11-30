'use strict';

const apiBase = require('./base');

const HTTP_METHOD = 'post';
const PATH_HAS_ID = false;

module.exports = (serviceConfig, params) => apiBase(serviceConfig, {
	method: HTTP_METHOD,
	pathHasId: PATH_HAS_ID,
	...params
});
