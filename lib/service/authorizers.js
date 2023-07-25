'use strict';

const defaultAuthorizers = require('./default-authorizers');

const authorizerBuilder = (name, headers, accountId) => ({
	name,
	arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-${name}`,
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

module.exports = ({ custom, ...serviceConfig }) => {

	const accountId = process.env.AUTHORIZER_ACCOUNT_ID;

	if(!accountId || typeof accountId !== 'string')
		throw new Error('Missing or invalid accountId for janis.authorizers hook, validate env variable AUTHORIZER_ACCOUNT_ID');

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
