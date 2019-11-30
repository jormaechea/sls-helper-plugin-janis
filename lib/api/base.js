'use strict';

const logger = require('lllog')();

const startCase = require('lodash.startcase');
const kebabCase = require('lodash.kebabcase');

const { getPathParameters } = require('../utils/parameters');
const { buildRequest } = require('../utils/request');

const INTEGRATION = 'lambda';

const apiBase = ({
	entityName,
	handler,
	path,
	pathHasId,
	method,
	methodName,
	caching,
	queryParameters,
	requestHeaders,
	cors,
	authorizer
}) => {

	const entityNameAsTitle = startCase(entityName);
	const entityNameAsKebab = kebabCase(entityName);

	const realPath = path || (pathHasId ? `/${entityNameAsKebab}/{id}` : `/${entityNameAsKebab}`);

	const pathParameters = getPathParameters(realPath);

	const request = buildRequest({ pathParameters, queryParameters, requestHeaders });

	methodName = methodName || method;

	const event = {
		integration: INTEGRATION,
		path: realPath,
		method: method.toLowerCase(),
		response: '${self:custom.apiResponseTemplate}',
		responses: '${self:custom.apiOfflineResponseTemplate}'
	};

	if(caching)
		event.caching = { enabled: '${self:custom.apiGatewayCaching.enabled}' };

	if(request)
		event.request = request;

	if(cors)
		event.cors = '${self:custom.cors}';

	if(authorizer)
		event.authorizer = `\${self:custom.authorizers.${authorizer}}`;

	const functionConfiguration = {
		handler: handler || 'src/lambda/RestApi/index.handler',
		description: `${entityNameAsTitle} ${startCase(methodName)} API`,
		package: {
			include: [
				`src/api/${entityNameAsKebab}/${methodName.toLowerCase()}.js`,
				`src/models/${entityNameAsKebab}.js`,
				'node_modules/logform/**' // Fix para dynamic import en una dependencia del logger
			]
		},
		events: [{ http: event }]
	};

	return { [`${entityNameAsTitle.replace(/ /g, '')}${startCase(methodName)}Api`]: functionConfiguration };
};

module.exports = ({ functions, ...serviceConfig }, hookParams) => {

	if(!serviceConfig.custom.apiRequestTemplate)
		logger.warn('Missing custom.apiRequestTemplate property. Add janis.templates hook first.');

	if(!serviceConfig.custom.apiResponseTemplate)
		logger.warn('Missing custom.apiResponseTemplate property. Add janis.templates hook first.');

	if(!serviceConfig.custom.apiOfflineResponseTemplate)
		logger.warn('Missing custom.apiOfflineResponseTemplate property. Add janis.templates hook first.');

	if(hookParams.cors && !serviceConfig.custom.cors)
		logger.warn('Missing custom.cors property. Add janis.cors hook first.');

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			apiBase(hookParams)
		]
	};
};
