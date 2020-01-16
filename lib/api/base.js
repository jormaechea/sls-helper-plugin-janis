'use strict';

const logger = require('lllog')();

const startcase = require('lodash.startcase');
const kebabcase = require('lodash.kebabcase');

const { getPathParameters } = require('../utils/parameters');
const { buildRequest } = require('../utils/request');

const INTEGRATION = 'lambda';

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
	cors,
	authorizer
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
		description: `${entityNameAsTitle} ${startcase(methodName)} API`,
		package: {
			include: [
				`src/api/${entityNameAsKebab}/${methodName.toLowerCase()}.js`,
				`src/models/${entityNameAsKebab}.js`
			]
		},
		events: [{ http: event }]
	};

	return { [`${entityNameAsTitle.replace(/ /g, '')}${startcase(methodName)}Api`]: functionConfiguration };
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

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			apiBase(hookParams)
		]
	};
};
