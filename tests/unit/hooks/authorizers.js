'use strict';

const assert = require('assert').strict;

const { authorizers } = require('../../..');

describe('Hooks', () => {

	describe('Authorizers', () => {

		it('Should return the authorizers service configuration', () => {

			const serviceConfig = authorizers({});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					authorizers: {
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
						}
					}
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
					authorizers: {
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
						}
					},
					foo: 'bar'
				}
			});
		});
	});

});
