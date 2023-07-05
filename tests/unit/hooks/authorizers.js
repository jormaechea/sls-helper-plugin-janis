'use strict';

const assert = require('assert').strict;

const { authorizers } = require('../../..');

describe('Hooks', () => {

	describe('Authorizers', () => {

		const accountId = '012345678910';

		const headerClient = 'method.request.header.janis-client';
		const headerApiKey = 'method.request.header.janis-api-key';
		const headerApiSecret = 'method.request.header.janis-api-secret';
		const headerEntity = 'method.request.header.janis-entity';

		const buildAuthorizer = (name, headers, realLambdaFunction) => ({
			[name]: {
				name,
				arn: `arn:aws:lambda:us-east-1:${accountId}:function:JanisAuthorizerService-\${self:custom.stage}-${realLambdaFunction || name}`,
				resultTtlInSeconds: 300,
				identitySource: headers.join(','),
				type: 'request'
			}
		});

		const expectedAuthorizers = {
			...buildAuthorizer('FullAuthorizer', [headerClient, headerApiKey, headerApiSecret]),
			...buildAuthorizer('NoClientAuthorizer', [headerApiKey, headerApiSecret]),
			...buildAuthorizer('ClientAuthorizer', [headerClient]),
			...buildAuthorizer('UserAuthorizer', [headerClient, headerApiKey, headerApiSecret]),
			...buildAuthorizer('DevUserAuthorizer', [headerClient, headerApiKey, headerApiSecret]),
			...buildAuthorizer('AdminAuthorizer', [headerClient, headerApiKey, headerApiSecret]),
			...buildAuthorizer('AdminNoClientAuthorizer', [headerApiKey, headerApiSecret]),
			...buildAuthorizer('ServiceAuthorizer', [headerClient, headerApiKey, headerApiSecret]),
			...buildAuthorizer('ServiceNoClientAuthorizer', [headerApiKey, headerApiSecret]),
			...buildAuthorizer('ImportExportAuthorizer', [headerClient, headerApiKey, headerApiSecret, headerEntity])
		};

		const originalEnvs = { ...process.env };

		afterEach(() => {
			process.env = { ...originalEnvs };
		});

		it('Should throw if accountId is not set in env var', () => {
			assert.throws(() => authorizers({}));
		});

		it('Should return the authorizers service configuration', () => {

			process.env.AUTHORIZER_ACCOUNT_ID = accountId;

			const serviceConfig = authorizers({});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: { ...expectedAuthorizers }
				}
			});
		});

		it('Should return the authorizers service configuration maintaining previous authorizers', () => {

			process.env.AUTHORIZER_ACCOUNT_ID = accountId;

			const serviceConfig = authorizers({
				custom: {
					authorizers: {
						MyCustomAuthorizer: {}
					}
				}
			});

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

			process.env.AUTHORIZER_ACCOUNT_ID = accountId;

			const serviceConfig = authorizers({
				custom: {
					foo: 'bar'
				}
			});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: { ...expectedAuthorizers },
					foo: 'bar'
				}
			});
		});
	});

});
