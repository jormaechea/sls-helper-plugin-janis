'use strict';

const { inspect } = require('util');

const buildCors = require('../utils/cors');

module.exports = ({ custom, ...serviceConfig }, corsConfig) => {

	if(corsConfig === false) {
		return {
			...serviceConfig,
			custom
		};
	}

	try {
		return {
			...serviceConfig,
			custom: {
				...(custom || {}),
				cors: buildCors(corsConfig)
			}
		};
	} catch(e) {
		throw new Error(`Missing or invalid config in janis.cors hook: ${inspect(corsConfig)}`);
	}
};
