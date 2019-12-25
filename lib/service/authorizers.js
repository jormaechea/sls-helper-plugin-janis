'use strict';

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
	]
};

const authorizerBuilder = (name, headers) => ({
	arn: `arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-\${self:custom.stage}-${name}`,
	resultTtlInSeconds: 300,
	identitySource: headers.map(header => `method.request.header.${header}`).join(','),
	type: 'request'
});

const buildAuthorizers = () => {
	return Object.entries(AUTHORIZERS).reduce((acum, [authorizer, headers]) => {
		return {
			...acum,
			[authorizer]: authorizerBuilder(authorizer, headers)
		};
	}, {});
};

module.exports = ({ custom, ...serviceConfig }) => ({
	...serviceConfig,
	custom: {
		...(custom || {}),
		authorizers: buildAuthorizers()
	}
});
