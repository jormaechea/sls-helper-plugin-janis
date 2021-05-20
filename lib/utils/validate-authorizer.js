'use strict';

const authorizers = require('./authorizers');

module.exports = authorizer => {
	if(!Object.keys(authorizers).find(validAuthorizer => validAuthorizer === authorizer))
		throw new Error(`Invalid authorizer '${authorizer}'`);
};
