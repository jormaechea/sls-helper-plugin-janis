'use strict';

const logger = require('lllog')();

const { kebabCase, titleCase } = require('../utils/string');

const validateAuthorizer = require('../utils/validate-authorizer');
const { parseFunctionLayers } = require('../utils/parse-function-layers');
const { removeTraceLayerEnv } = require('../utils/trace-layer');

const INTEGRATION = 'lambda';

const eventListener = ({
	serviceName,
	entityName,
	eventName,
	mustHaveClient,
	listenersDirName,
	layers,
	addLayers,
	skipTraceLayer,
	package: pkg,
	authorizer,
	timeout,
	functionRawProps
}, serviceConfig) => {

	const serviceNameAsTitle = titleCase(serviceName);
	const serviceAsKebab = kebabCase(serviceName);

	const entityNameAsTitle = titleCase(entityName);
	const entityNameAsKebab = kebabCase(entityName);

	const eventNameAsTitle = titleCase(eventName);
	const eventNameAsKebab = kebabCase(eventName);

	const authorizerName = authorizer || (mustHaveClient ? 'ServiceAuthorizer' : 'ServiceNoClientAuthorizer');

	validateAuthorizer(serviceConfig, authorizerName);

	const listenerCode = `${serviceNameAsTitle}${entityNameAsTitle}${eventNameAsTitle}`.replace(/ /g, '');

	const functionConfiguration = {
		name: `EL-\${self:custom.serviceName}-${listenerCode}-\${self:custom.stage}`,
		handler: `src/${listenersDirName}/${serviceAsKebab}/${entityNameAsKebab}/${eventNameAsKebab}.handler`,
		description: `${serviceNameAsTitle} ${entityNameAsTitle} ${eventNameAsTitle} Listener`,
		events: [
			{
				http: {
					integration: INTEGRATION,
					path: `/listener/${serviceAsKebab}/${entityNameAsKebab}/${eventNameAsKebab}`,
					method: 'post',
					authorizer: `\${self:custom.authorizers.${authorizerName}}`,
					request: {
						template: '${self:custom.apiRequestTemplate}'
					},
					response: '${self:custom.apiResponseTemplate}'
				}
			}
		],
		...parseFunctionLayers(layers, addLayers, skipTraceLayer, serviceConfig),
		...removeTraceLayerEnv(skipTraceLayer),
		...functionRawProps
	};

	if(pkg && pkg.include)
		functionConfiguration.package = pkg;

	if(timeout)
		functionConfiguration.timeout = timeout;

	return {
		[`EL-${listenerCode}`]: functionConfiguration
	};
};

const defaultParams = {
	mustHaveClient: false,
	listenersDirName: 'event-listeners'
};

module.exports = ({ functions, ...serviceConfig }, hookParams) => {

	const params = {
		...defaultParams,
		...hookParams
	};

	if(!params.serviceName)
		throw new Error('Missing or empty serviceName in janis.eventListener hook.');

	if(!params.entityName)
		throw new Error('Missing or empty entityName in janis.eventListener hook.');

	if(!params.eventName)
		throw new Error('Missing or empty eventName in janis.eventListener hook.');

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.apiRequestTemplate)
		logger.warn('Missing custom.apiRequestTemplate property. Add janis.templates hook first.');

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.apiResponseTemplate)
		logger.warn('Missing custom.apiResponseTemplate property. Add janis.templates hook first.');

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			eventListener(params, serviceConfig)
		]
	};
};
