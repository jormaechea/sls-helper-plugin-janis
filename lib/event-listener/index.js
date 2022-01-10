'use strict';

const logger = require('lllog')();

const startcase = require('lodash.startcase');
const kebabcase = require('../utils/kebabcase');

const validateAuthorizer = require('../utils/validate-authorizer');

const INTEGRATION = 'lambda';

const eventListener = ({
	serviceName,
	entityName,
	eventName,
	mustHaveClient,
	listenersDirName,
	package: pkg,
	authorizer,
	timeout
}, serviceConfig) => {

	const serviceNameAsTitle = startcase(serviceName);
	const serviceAsKebab = kebabcase(serviceName);

	const entityNameAsTitle = startcase(entityName);
	const entityNameAsKebab = kebabcase(entityName);

	const eventNameAsTitle = startcase(eventName);
	const eventNameAsKebab = kebabcase(eventName);

	const authorizerName = authorizer || (mustHaveClient ? 'ServiceAuthorizer' : 'ServiceNoClientAuthorizer');

	validateAuthorizer(serviceConfig, authorizerName);

	const listenerCode = `${serviceNameAsTitle}${entityNameAsTitle}${eventNameAsTitle}`.replace(/ /g, '');

	const functionConfiguration = {
		name: `\${self:custom.serviceName}-\${self:custom.stage}-EL-${listenerCode}`,
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
					response: '${self:custom.apiResponseTemplate}',
					responses: '${self:custom.apiOfflineResponseTemplate}'
				}
			}
		]
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

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.apiOfflineResponseTemplate)
		logger.warn('Missing custom.apiOfflineResponseTemplate property. Add janis.templates hook first.');

	return {
		...serviceConfig,
		functions: [
			...(functions || []),
			eventListener(params, serviceConfig)
		]
	};
};
