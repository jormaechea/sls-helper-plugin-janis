'use strict';

const apiBase = require('./base');

const HTTP_METHOD = 'put';
const PATH_HAS_ID = true;

module.exports = (serviceConfig, params) => apiBase(serviceConfig, {
	method: HTTP_METHOD,
	pathHasId: PATH_HAS_ID,
	...params
});
