'use strict';

const path = require('path');

const getFileDirFromApiPath = apiPath => {

	return path.resolve(apiPath
		.toLowerCase()
		.replace(/{\w+}/g, '')
		.replace(/\/{2,}/g, '/'))
		.replace(/^\//, '')
		.replace(/\/$/, '');
};

module.exports = {
	getFileDirFromApiPath
};
