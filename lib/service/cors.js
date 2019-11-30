'use strict';

const { inspect } = require('util');

const buildCors = require('../utils/cors');

module.exports = ({ custom, ...serviceConfig }, corsConfig) => {

	if(corsConfig === false) {
		return {
			...serviceConfig,
			...custom
		};
	}

	if(typeof corsConfig !== 'undefined'
		&& typeof corsConfig !== 'boolean'
		&& (typeof corsConfig !== 'object' || Array.isArray(corsConfig) || !Object.keys(corsConfig).length))

		throw new Error(`Missing or invalid config in janis.cors hook: ${inspect(corsConfig)}`);

	return {
		...serviceConfig,
		custom: {
			...(custom || {}),
			cors: buildCors(corsConfig)
		}
	};
};
