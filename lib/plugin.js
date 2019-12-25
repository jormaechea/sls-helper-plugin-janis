'use strict';

module.exports.base = require('./service/base');

module.exports.templates = require('./service/templates');

module.exports.authorizers = require('./service/authorizers');

module.exports.cors = require('./service/cors');

module.exports.apiGet = require('./api/get');

module.exports.apiList = require('./api/list');

module.exports.apiPost = require('./api/post');

module.exports.apiPut = require('./api/put');

module.exports.eventListener = require('./event-listener');
