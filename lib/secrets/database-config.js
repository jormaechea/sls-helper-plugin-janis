'use strict';

const logger = require('lllog')();

const defaultParams = {
	secretName: 'janis/${self:custom.serviceCode}/${self:custom.stage}/db-config',
	description: 'Database config secret for janis ${self:custom.serviceCode} ${self:custom.stage}',
	passwordKey: 'password',
	passwordLength: 40
};

module.exports = ({ resources, ...serviceConfig }, hookParams) => {

	const params = {
		...defaultParams,
		...hookParams
	};

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.stage)
		logger.warn('Missing custom.stage property in janis.dbConfig hook. Add janis.base hook first.');

	/* istanbul ignore next */
	if(!serviceConfig.custom || !serviceConfig.custom.serviceCode)
		logger.warn('Missing custom.serviceCode property in janis.dbConfig hook. Add janis.base hook first.');

	if(!params.secretName)
		throw new Error('Empty secretName in janis.dbConfig hook.');

	if(!params.secret)
		throw new Error('Missing or empty secret in janis.dbConfig hook.');

	if(typeof params.secret !== 'string' && (typeof params.secret !== 'object' || Array.isArray(params.secret)))
		throw new Error('Invalid secret in janis.dbConfig hook. It must be an object or a JSON stringifies object.');

	if(!params.passwordKey)
		throw new Error('Empty passwordKey in janis.dbConfig hook.');

	if(!params.passwordLength)
		throw new Error('Empty passwordLength in janis.dbConfig hook.');

	if(!Number.isInteger(params.passwordLength) || params.passwordLength < 32)
		throw new Error('Invalid passwordLength in janis.dbConfig hook. It should be an integer greater or equal to 32.');

	const {
		Resources: initialResources = {}
	} = resources || {};

	return {
		...serviceConfig,
		resources: {
			Resources: {
				...initialResources,
				ServiceDatabaseConfig: {
					Type: 'AWS::SecretsManager::Secret',
					Properties: {
						Name: params.secretName,
						Description: params.description,
						GenerateSecretString: {
							SecretStringTemplate: typeof params.secret === 'string' ? params.secret : JSON.stringify(params.secret),
							GenerateStringKey: params.passwordKey,
							PasswordLength: params.passwordLength
						}
					}
				}
			}
		}
	};
};
