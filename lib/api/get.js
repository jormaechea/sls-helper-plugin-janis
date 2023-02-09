'use strict';

const apiBase = require('./base');

const HTTP_METHOD = 'get';
const PATH_HAS_ID = true;

module.exports = (serviceConfig, params) => apiBase.buildApi(serviceConfig, {
	method: HTTP_METHOD,
	pathHasId: PATH_HAS_ID,
	skipTraceLayer: true,
	...params
});
