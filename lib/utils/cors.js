'use strict';

const { inspect } = require('util');

const DEFAULT_CORS_CONFIG = {
	origins: [
		'https://${self:custom.janisDomains.${self:custom.stage}}',
		'https://app.${self:custom.janisDomains.${self:custom.stage}}',
		'http://localhost:3001',
		'http://janis.localhost:3001',
		'http://app.janis.localhost:3001'
	],
	headers: [
		'content-type',
		'janis-api-key',
		'janis-api-secret',
		'janis-client',
		'x-api-key',
		'x-janis-page',
		'x-janis-page-size'
	],
	allowCredentials: true,
	maxAge: 600
};

const makeUserDefinedCors = ({ replace, ...userDefinedCors }) => {

	const {
		origins: defaultOrigins,
		headers: defaultHeaders,
		allowCredentials: defaultAllowCredentials,
		maxAge: defaultMaxAge
	} = DEFAULT_CORS_CONFIG;

	const {
		origins: userDefinedOrigins,
		headers: userDefinedHeaders,
		allowCredentials: userDefinedAllowCredentials,
		maxAge: userDefinedMaxAge
	} = userDefinedCors;

	return {
		origins: replace && userDefinedOrigins ? userDefinedOrigins : [...defaultOrigins, ...(userDefinedOrigins || [])],
		headers: replace && userDefinedHeaders ? userDefinedHeaders : [...defaultHeaders, ...(userDefinedHeaders || [])],
		allowCredentials: userDefinedAllowCredentials === undefined ? defaultAllowCredentials : userDefinedAllowCredentials,
		maxAge: userDefinedMaxAge === undefined ? defaultMaxAge : userDefinedMaxAge
	};
};

module.exports = userDefinedCors => {

	if(userDefinedCors === undefined || userDefinedCors === true)
		return DEFAULT_CORS_CONFIG;

	if(userDefinedCors !== null && typeof userDefinedCors === 'object' && !Array.isArray(userDefinedCors))
		return makeUserDefinedCors(userDefinedCors);

	throw new Error(`Invalid CORS configuration: ${inspect(userDefinedCors)}`);
};
