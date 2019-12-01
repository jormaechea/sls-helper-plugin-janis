'use strict';

const AUTHORIZERS = {
	FullAuthorizer: [
		'method.request.header.janis-client',
		'method.request.header.janis-api-key',
		'method.request.header.janis-api-secret'
	],
	NoClientAuthorizer: [
		'method.request.header.janis-api-key',
		'method.request.header.janis-api-secret'
	]
};

const authorizerBuilder = (name, headers) => ({
	arn: `arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-\${self:custom.stage}-${name}`,
	resultTtlInSeconds: 300,
	identitySource: headers.join(','),
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
