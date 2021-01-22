'use strict';

const { inspect } = require('util');

const AUTHORIZERS = {
	FullAuthorizer: [
		'janis-client',
		'janis-api-key',
		'janis-api-secret'
	],
	NoClientAuthorizer: [
		'janis-api-key',
		'janis-api-secret'
	],
	LoggedAuthorizer: [
		'janis-api-key',
		'janis-api-secret'
	],
	ApiKeyAuthorizer: [
		'janis-api-key',
		'janis-api-secret'
	],
	UserAuthorizer: [
		'janis-api-key',
		'janis-api-secret'
	],
	DevUserAuthorizer: [
		'janis-api-key',
		'janis-api-secret'
	],
	ServiceAuthorizer: [
		'janis-client',
		'janis-api-key',
		'janis-api-secret'
	],
	ServiceNoClientAuthorizer: [
		'janis-api-key',
		'janis-api-secret'
	],
	ClientAuthorizer: [
		'janis-client'
	],
	ImportExportAuthorizer: [
		'janis-api-key',
		'janis-api-secret',
		'janis-entity'
	],
	ImportAuthorizer: [
		'janis-api-key',
		'janis-api-secret',
		'janis-service',
		'janis-entity'
	],
	ExportAuthorizer: [
		'janis-api-key',
		'janis-api-secret',
		'janis-entity'
	]
};

const authorizersNameToFunctionMapping = {
	ServiceNoClientAuthorizer: 'ServiceAuthorizer'
};

const authorizerBuilder = (name, headers, accountId) => ({
	name,
	arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-${authorizersNameToFunctionMapping[name] || name}`,
	resultTtlInSeconds: 300,
	identitySource: headers.map(header => `method.request.header.${header}`).join(','),
	type: 'request'
});

const buildAuthorizers = accountId => {
	return Object.entries(AUTHORIZERS).reduce((acum, [authorizer, headers]) => {
		return {
			...acum,
			[authorizer]: authorizerBuilder(authorizer, headers, accountId)
		};
	}, {});
};

module.exports = ({ custom, ...serviceConfig }, { accountId }) => {

	if(!accountId || typeof accountId !== 'string')
		throw new Error(`Missing or invalid accountId in janis.authorizers hook: ${inspect(accountId)}`);

	const authorizers = (custom && custom.authorizers) || {};

	return {
		...serviceConfig,
		custom: {
			...(custom || {}),
			authorizers: {
				...authorizers,
				...buildAuthorizers(accountId)
			}
		}
	};
};
