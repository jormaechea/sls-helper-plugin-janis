'use strict';

const { inspect } = require('util');

const authorizers = require('../utils/authorizers');

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
	return Object.entries(authorizers).reduce((acum, [authorizer, headers]) => {
		return {
			...acum,
			[authorizer]: authorizerBuilder(authorizer, headers, accountId)
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
