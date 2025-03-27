'use strict';

const logger = require('lllog')();

const { getPathParameters } = require('../utils/parameters');
const { buildRequest } = require('../utils/request');

const validateAuthorizer = require('../utils/validate-authorizer');
const { parseFunctionLayers } = require('../utils/parse-function-layers');
const { upperCamelCase } = require('../utils/string');
const { removeTraceLayerEnv } = require('../utils/trace-layer');

const INTEGRATION = 'lambda';

const normalizePath = path => {
	return `/${path}`
		.replace(/^\/+/, '/')
		.replace(/\/+$/, '');
};

const apiPathPartToName = apiPathPart => apiPathPart
	.replace(/-/g, 'Dash')
	.replace(/\{(.+)\}/, '$1Var')
	.replace(/[^0-9A-Za-z]/g, '')
	.replace(/^./, firstChar => firstChar.toUpperCase());

const apiPathToName = apiPath => apiPath
	.split('/')
	.map(apiPathPart => apiPathPartToName(apiPathPart))
	.join('');

const getFunctionName = (method, apiPath) => `${upperCamelCase(method)}${apiPathToName(apiPath)}`;

/**
 * This is implemented to avoid breaking APIs that have been set with unknown methodNames but still use standard HTTP methods in API filename
 *
 *	@param {string} methodName
 *	@param {string} httpMethod
 *	@returns {string}
 */
const pathSafeMethodName = (methodName, httpMethod) => {
	const validMethodNames = ['get', 'list', 'post', 'put', 'delete', 'patch'];
	return validMethodNames.includes(methodName) ? methodName : httpMethod;
};

/**
 * @param {string} methodName
 * @param {string} apiPath
 */
const convertPathToHandler = (methodName, apiPath) => {

	const apiPathParts = apiPath.slice(1).split('/')
		.filter(apiPathPart => !apiPathPart.startsWith('{') && !apiPathPart.endsWith('}'));

	return `src/api/${apiPathParts.join('/')}/${pathSafeMethodName(methodName)}.handler`;
};

/**
 * @param {string} normalizedPath
 * @returns {boolean}
 */
const pathEndsWithVariable = normalizedPath => {
	const lastPathPart = normalizedPath.split('/').pop();
	return lastPathPart.startsWith('{') && lastPathPart.endsWith('}');
};

const apiBase = (serviceConfig, {
	functionName,
	path,
	handler,
	description,
	method = 'get',
	methodName,
	layers,
	addLayers,
	skipTraceLayer,
	caching,
	queryParameters,
	requestTemplates,
	requestHeaders,
	cors,
	authorizer,
	timeout,
	package: pkg,
	functionRawProps,
	eventRawProps
}) => {

	if(!path)
		throw new Error('Missing or empty path hook configuration in API hook');

	if(!method)
		throw new Error('Missing or empty method hook configuration in API hook');

	const normalizedPath = normalizePath(path);

	const pathParameters = getPathParameters(normalizedPath);

	if(!methodName)
		methodName = method === 'get' && !pathEndsWithVariable(normalizedPath) ? 'list' : method;

	const event = {
		integration: INTEGRATION,
		path: normalizedPath,
		method: method.toLowerCase(),
		request: buildRequest({ requestTemplates, pathParameters, queryParameters, requestHeaders }),
		response: '${self:custom.apiResponseTemplate}'
	};

	if(caching)
		event.caching = { enabled: '${self:custom.apiGatewayCaching.enabled}' };

	if(cors)
		event.cors = '${self:custom.cors}';

	if(authorizer)
		event.authorizer = `\${self:custom.authorizers.${authorizer}}`;

	functionName = functionName || getFunctionName(methodName, normalizedPath);

	const functionConfiguration = {
		name: `API-\${self:custom.serviceName}-${functionName}-\${self:custom.stage}`,
		handler: handler || convertPathToHandler(methodName, normalizedPath),
		description,
		events: [{
			http: {
				...event,
				...eventRawProps
			}
		}],
		...parseFunctionLayers(layers, addLayers, skipTraceLayer, serviceConfig),
		...functionRawProps,
		...removeTraceLayerEnv(skipTraceLayer, functionRawProps?.environment)
	};

	if(pkg && pkg.include) {
		functionConfiguration.package ??= {};
		functionConfiguration.package.include ??= [];
		functionConfiguration.package.include.push(...pkg.include);
	}

	if(timeout)
		functionConfiguration.timeout = timeout;

	return {
		[`API-${functionName}`]: functionConfiguration
	};
};

module.exports = ({ functions, ...serviceConfig }, hookParams) => {

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.apiRequestTemplate)
		logger.warn('Missing custom.apiRequestTemplate property. Add janis.templates hook first.');

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.apiResponseTemplate)
		logger.warn('Missing custom.apiResponseTemplate property. Add janis.templates hook first.');

	/* istanbul ignore next */
	if(hookParams.cors && (!serviceConfig.custom || !serviceConfig.custom.cors))
		logger.warn('Missing custom.cors property. Add janis.cors hook first.');

	validateAuthorizer(serviceConfig, hookParams.authorizer);

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			apiBase(serviceConfig, hookParams)
		]
	};
};
