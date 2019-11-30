'use strict';

const AUTHORIZERS = [
	'FullAuthorizer',
	'NoClientAuthorizer'
];

const authorizerBuilder = name => ({
	arn: `arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-\${self:custom.stage}-${name}`,
	resultTtlInSeconds: 300,
	identitySource: 'method.request.header.janis-client,method.request.header.janis-api-key,method.request.header.janis-api-secret',
	type: 'request'
});

const buildAuthorizers = () => {
	return AUTHORIZERS.reduce((acum, authorizer) => {
		return {
			...acum,
			[authorizer]: authorizerBuilder(authorizer)
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
