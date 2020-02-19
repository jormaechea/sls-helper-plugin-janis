'use strict';

const logger = require('lllog')();

const startcase = require('lodash.startcase');

const { getPathParameters } = require('../utils/parameters');
const { buildRequest } = require('../utils/request');
const { getFileDirFromApiPath } = require('../utils/fs');

const INTEGRATION = 'lambda';

const normalizePath = path => {
	return `/${path}`
		.replace(/^\/+/, '/')
		.replace(/\/+$/, '');
};

const apiBase = ({
	path,
	handler,
	description,
	method = 'get',
	methodName,
	caching,
	queryParameters,
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

	const pathParameters = getPathParameters(path);
	const fileDir = getFileDirFromApiPath(path);

	methodName = methodName || method;

	const event = {
		integration: INTEGRATION,
		path: normalizePath(path),
		method: method.toLowerCase(),
		request: buildRequest({ pathParameters, queryParameters, requestHeaders }),
		response: '${self:custom.apiResponseTemplate}',
		responses: '${self:custom.apiOfflineResponseTemplate}'
	};

	if(caching)
		event.caching = { enabled: '${self:custom.apiGatewayCaching.enabled}' };

	if(cors)
		event.cors = '${self:custom.cors}';

	if(authorizer)
		event.authorizer = `\${self:custom.authorizers.${authorizer}}`;

	const functionConfiguration = {
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

	const apiName = startcase(`${fileDir}-${methodName}-api`).replace(/ /g, '');

	return {
		[apiName]:
		functionConfiguration
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
