'use strict';

const logger = require('lllog')();

const startcase = require('lodash.startcase');
const kebabcase = require('../utils/kebabcase');

const { getPathParameters } = require('../utils/parameters');
const { buildRequest } = require('../utils/request');
const buildCors = require('../utils/cors');

const validateAuthorizer = require('../utils/validate-authorizer');

const INTEGRATION = 'lambda';

const getFunctionNamePrefix = methodName => {
	switch(methodName.toLowerCase()) {
		case 'post':
			return 'Create';
		case 'put':
			return 'Update';
		default:
			return startcase(methodName);
	}
};

const apiBase = ({
	entityName,
	handler,
	path,
	pathHasId,
	method = 'get',
	methodName,
	caching,
	queryParameters,
	requestHeaders,
	requestTemplates,
	cors,
	authorizer,
	timeout,
	package: pkg,
	functionRawProps,
	eventRawProps
}) => {

	if(!entityName)
		throw new Error('Missing or empty entityName hook configuration in API hook');

	if(!method)
		throw new Error('Missing or empty method hook configuration in API hook');

	const entityNameAsTitle = startcase(entityName);
	const entityNameAsKebab = kebabcase(entityName);

	const realPath = path || (pathHasId ? `/${entityNameAsKebab}/{id}` : `/${entityNameAsKebab}`);

	const pathParameters = getPathParameters(realPath);

	methodName = methodName || method;

	const event = {
		integration: INTEGRATION,
		path: realPath,
		method: method.toLowerCase(),
		request: buildRequest({ requestTemplates, pathParameters, queryParameters, requestHeaders }),
		response: '${self:custom.apiResponseTemplate}',
		responses: '${self:custom.apiOfflineResponseTemplate}'
	};

	if(caching)
		event.caching = { enabled: '${self:custom.apiGatewayCaching.enabled}' };

	if(cors)
		event.cors = cors === true ? '${self:custom.cors}' : buildCors(cors);

	if(authorizer)
		event.authorizer = `\${self:custom.authorizers.${authorizer}}`;

	const functionConfiguration = {
		name: `API${getFunctionNamePrefix(methodName)}-\${self:custom.serviceName}-${entityNameAsTitle.replace(/ /g, '')}-\${self:custom.stage}`,
		handler: handler || 'src/lambda/RestApi/index.handler',
		description: `${entityNameAsTitle} ${startcase(methodName)} API`,
		package: {
			include: [
				`src/api/${entityNameAsKebab}/${methodName.toLowerCase()}.js`,
				`src/models/${entityNameAsKebab}.js`
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
		[`API${getFunctionNamePrefix(methodName)}-${entityNameAsTitle.replace(/ /g, '')}`]: functionConfiguration
	};
};

module.exports.buildApi = ({ functions, ...serviceConfig }, hookParams) => {

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

	validateAuthorizer(serviceConfig, hookParams.authorizer);

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			apiBase(hookParams)
		]
	};
};
