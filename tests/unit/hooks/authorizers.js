'use strict';

const assert = require('assert').strict;

const { authorizers } = require('../../..');

describe('Hooks', () => {

	describe('Authorizers', () => {

		const accountId = '012345678910';

		const headerClient = 'method.request.header.janis-client';
		const headerApiKey = 'method.request.header.janis-api-key';
		const headerApiSecret = 'method.request.header.janis-api-secret';
		const headerService = 'method.request.header.janis-service';
		const headerEntity = 'method.request.header.janis-entity';

		const expectedAuthorizers = {
			FullAuthorizer: {
				name: 'FullAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-FullAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerClient},${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			NoClientAuthorizer: {
				name: 'NoClientAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-NoClientAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			LoggedAuthorizer: {
				name: 'LoggedAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-LoggedAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			ApiKeyAuthorizer: {
				name: 'ApiKeyAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ApiKeyAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			UserAuthorizer: {
				name: 'UserAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-UserAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			DevUserAuthorizer: {
				name: 'DevUserAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-DevUserAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			AdminAuthorizer: {
				name: 'AdminAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-AdminAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerClient},${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			AdminNoClientAuthorizer: {
				name: 'AdminNoClientAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-AdminNoClientAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			ServiceAuthorizer: {
				name: 'ServiceAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ServiceAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerClient},${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			ServiceNoClientAuthorizer: {
				name: 'ServiceNoClientAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ServiceAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret}`,
				type: 'request'
			},

			ClientAuthorizer: {
				name: 'ClientAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ClientAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: headerClient,
				type: 'request'
			},

			ImportExportAuthorizer: {
				name: 'ImportExportAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ImportExportAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret},${headerEntity}`,
				type: 'request'
			},

			ImportAuthorizer: {
				name: 'ImportAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ImportAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret},${headerService},${headerEntity}`,
				type: 'request'
			},

			ExportAuthorizer: {
				name: 'ExportAuthorizer',
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-ExportAuthorizer`,
				resultTtlInSeconds: 300,
				identitySource: `${headerApiKey},${headerApiSecret},${headerEntity}`,
				type: 'request'
			}
		};

		it('Should throw if accountId is not passed', () => {

			assert.throws(() => authorizers({}, {}));
		});

		it('Should return the authorizers service configuration', () => {

			const serviceConfig = authorizers({}, { accountId });

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: { ...expectedAuthorizers }
				}
			});
		});

		it('Should return the authorizers service configuration maintaining previous authorizers', () => {

			const serviceConfig = authorizers({
				custom: {
					authorizers: {
						MyCustomAuthorizer: {}
					}
				}
			}, { accountId });

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: {
						MyCustomAuthorizer: {},
						...expectedAuthorizers
					}
				}
			});
		});

		it('Should not override other configurations', () => {

			const serviceConfig = authorizers({
				custom: {
					foo: 'bar'
				}
			}, { accountId });

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: { ...expectedAuthorizers },
					foo: 'bar'
				}
			});
		});
	});

});
