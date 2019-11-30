'use strict';

const base = require('./service/base');
const templates = require('./service/templates');
const authorizers = require('./service/authorizers');
const cors = require('./service/cors');
const apiGet = require('./api/get');
const apiList = require('./api/list');
const apiPost = require('./api/post');
const apiPut = require('./api/put');

module.exports = {
	base,
	templates,
	authorizers,
	cors,
	apiGet,
	apiList,
	apiPost,
	apiPut
};
