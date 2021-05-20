'use strict';

const logger = require('lllog')();

const startcase = require('lodash.startcase');

const { getPathParameters } = require('../utils/parameters');
const { buildRequest } = require('../utils/request');
const { getFileDirFromApiPath } = require('../utils/fs');

const validateAuthorizer = require('../utils/validate-authorizer');

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

const getFunctionName = (method, apiPath) => `${startcase(method)}${apiPathToName(apiPath)}`;

const apiBase = ({
	path,
	handler,
	description,
	method = 'get',
	methodName,
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
	const fileDir = getFileDirFromApiPath(normalizedPath);

	methodName = methodName || method;

	const event = {
		integration: INTEGRATION,
		path: normalizedPath,
		method: method.toLowerCase(),
		request: buildRequest({ requestTemplates, pathParameters, queryParameters, requestHeaders }),
		response: '${self:custom.apiResponseTemplate}',
		responses: '${self:custom.apiOfflineResponseTemplate}'
	};

	if(caching)
		event.caching = { enabled: '${self:custom.apiGatewayCaching.enabled}' };

	if(cors)
		event.cors = '${self:custom.cors}';

	if(authorizer) {
		validateAuthorizer(authorizer);
		event.authorizer = `\${self:custom.authorizers.${authorizer}}`;
	}

	const functionName = getFunctionName(methodName, normalizedPath);

	const functionConfiguration = {
		name: `API-\${self:custom.serviceName}-${functionName}-\${self:custom.stage}`,
		handler: handler || 'src/lambda/RestApi/index.handler',
		description,
		package: {
			include: [
				`src/api/${fileDir}/${methodName.toLowerCase()}.js`
			]
		},
		events: [{
			http: {
				...event,
				...eventRawProps
			}
		}],
		...functionRawProps
	};

	if(pkg && pkg.include)
		functionConfiguration.package.include.push(...pkg.include);

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
	if(!serviceConfig.custom || !serviceConfig.custom.apiOfflineResponseTemplate)
		logger.warn('Missing custom.apiOfflineResponseTemplate property. Add janis.templates hook first.');

	/* istanbul ignore next */
	if(hookParams.cors && (!serviceConfig.custom || !serviceConfig.custom.cors))
		logger.warn('Missing custom.cors property. Add janis.cors hook first.');

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			apiBase(hookParams)
		]
	};
};
