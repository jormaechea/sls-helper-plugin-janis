'use strict';

const assert = require('assert').strict;

const { eventListener } = require('../../..');

describe('Hooks', () => {

	describe('Event Listener', () => {

		context('Config validation', () => {

			it('Should throw if serviceName param is missing', () => {

				assert.throws(() => eventListener({}, {
					entityName: 'product name',
					eventName: 'something happened'
				}), {
					message: /serviceName/
				});
			});

			it('Should throw if entityName param is missing', () => {

				assert.throws(() => eventListener({}, {
					serviceName: 'my service',
					eventName: 'something happened'
				}), {
					message: /entityName/
				});
			});

			it('Should throw if eventName param is missing', () => {

				assert.throws(() => eventListener({}, {
					serviceName: 'my service',
					entityName: 'product name'
				}), {
					message: /eventName/
				});
			});
		});

		context('Listener generation', () => {

			it('Should return the service config with a default event listener (no client and default path) when passing the required params', () => {

				const serviceConfig = eventListener({}, {
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							MyServiceProductNameSomethingHappenedListener: {
								handler: 'src/event-listeners/my-service/product-name/something-happened.handler',
								description: 'My Service Product Name Something Happened Listener',
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/listener/my-service/product-name/something-happened',
											method: 'post',
											authorizer: '${self:custom.authorizers.ServiceNoClientAuthorizer}',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											responses: '${self:custom.apiOfflineResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should override the listener path if listenersDirName param is passed', () => {

				const serviceConfig = eventListener({}, {
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					listenersDirName: 'listeners'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							MyServiceProductNameSomethingHappenedListener: {
								handler: 'src/listeners/my-service/product-name/something-happened.handler',
								description: 'My Service Product Name Something Happened Listener',
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/listener/my-service/product-name/something-happened',
											method: 'post',
											authorizer: '${self:custom.authorizers.ServiceNoClientAuthorizer}',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											responses: '${self:custom.apiOfflineResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should set the ServiceAuthorizer if mustHaveClient is passed as truthy', () => {

				const serviceConfig = eventListener({}, {
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					mustHaveClient: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							MyServiceProductNameSomethingHappenedListener: {
								handler: 'src/event-listeners/my-service/product-name/something-happened.handler',
								description: 'My Service Product Name Something Happened Listener',
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/listener/my-service/product-name/something-happened',
											method: 'post',
											authorizer: '${self:custom.authorizers.ServiceAuthorizer}',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											responses: '${self:custom.apiOfflineResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

		});
	});

});
