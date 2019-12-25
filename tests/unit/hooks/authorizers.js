'use strict';

const assert = require('assert').strict;

const { authorizers } = require('../../..');

describe('Hooks', () => {

	describe('Authorizers', () => {

		const expectedAuthorizers = {
			FullAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-FullAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-client,method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			NoClientAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-NoClientAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			LoggedAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-LoggedAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			ApiKeyAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-ApiKeyAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			UserAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-UserAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			DevUserAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-DevUserAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			ServiceAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-ServiceAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-client,method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			ServiceNoClientAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-ServiceNoClientAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-api-key,method.request.header.janis-api-secret',
				type: 'request'
			},

			ClientAuthorizer: {
				arn: 'arn:aws:lambda:us-east-1:026813942644:function:JanisIdService-${self:custom.stage}-ClientAuthorizer',
				resultTtlInSeconds: 300,
				identitySource: 'method.request.header.janis-client',
				type: 'request'
			}
		};

		it('Should return the authorizers service configuration', () => {

			const serviceConfig = authorizers({});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: { ...expectedAuthorizers }
				}
			});
		});

		it('Should not override other configurations', () => {

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
