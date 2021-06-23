'use strict';

const { inspect } = require('util');

const defaultAuthorizers = require('./default-authorizers');

const authorizersNameToFunctionMapping = {
	ServiceNoClientAuthorizer: 'ServiceAuthorizer',
	AdminNoClientAuthorizer: 'AdminAuthorizer',
	NoClientAuthorizer: 'FullAuthorizer'
};

const authorizerBuilder = (name, headers, accountId) => ({
	name,
	arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-${authorizersNameToFunctionMapping[name] || name}`,
	resultTtlInSeconds: 300,
	identitySource: headers.map(header => `method.request.header.${header}`).join(','),
	type: 'request'
});

const buildAuthorizers = accountId => {
	return Object.entries(defaultAuthorizers).reduce((builtAuthorizers, [authorizerName, headers]) => {
		return {
			...builtAuthorizers,
			[authorizerName]: authorizerBuilder(authorizerName, headers, accountId)
		};
	}, {});
};

module.exports = ({ custom, ...serviceConfig }, { accountId }) => {

	if(!accountId || typeof accountId !== 'string')
		throw new Error(`Missing or invalid accountId in janis.authorizers hook: ${inspect(accountId)}`);

	const customAuthorizers = (custom && custom.authorizers) || {};

	return {
		...serviceConfig,
		custom: {
			...(custom || {}),
			authorizers: {
				...customAuthorizers,
				...buildAuthorizers(accountId)
			}
		}
	};
};
