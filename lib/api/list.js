'use strict';

const apiBase = require('./base');

const HTTP_METHOD = 'get';
const PATH_HAS_ID = false;

const METHOD_NAME = 'list';

module.exports = (serviceConfig, params) => apiBase.buildApi(serviceConfig, {
	method: HTTP_METHOD,
	methodName: METHOD_NAME,
	pathHasId: PATH_HAS_ID,
	skipTraceLayer: true,
	...params
});
