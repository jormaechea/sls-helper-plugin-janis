'use strict';

const assert = require('assert').strict;

const { eventListener } = require('../../..');

describe('Hooks', () => {

	const authorizers = {
		ServiceAuthorizer: {},
		ServiceNoClientAuthorizer: {},
		FullAuthorizer: {}
	};

	const previousServiceConfig = { custom: { authorizers } };

	const assertConfig = (hookParams, eventListenerFunction) => {

		const serviceConfig = eventListener(previousServiceConfig, hookParams);

		assert.deepStrictEqual(serviceConfig, {
			...previousServiceConfig,
			functions: [eventListenerFunction]
		});
	};

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

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened'
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
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
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						]
					}
				});
			});

			it('Should set raw props in the function if they are passed', () => {

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					functionRawProps: {
						foo: 'bar'
					}
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
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
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						],
						foo: 'bar'
					}
				});
			});

			it('Should override the listener path if listenersDirName param is passed', () => {

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					listenersDirName: 'listeners'
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
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
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						]
					}
				});
			});

			it('Should set the ServiceAuthorizer if mustHaveClient is passed as truthy', () => {

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					mustHaveClient: true
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
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
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						]
					}
				});
			});

			it('Should add the package include if package.include param is passed', () => {

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					mustHaveClient: true,
					package: { include: ['src/models/new-model.js'] }
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
						handler: 'src/event-listeners/my-service/product-name/something-happened.handler',
						description: 'My Service Product Name Something Happened Listener',
						package: { include: ['src/models/new-model.js'] },
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
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						]
					}
				});
			});

			it('Should set a custom authorizer if authorizer prop is passed', () => {

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					authorizer: 'FullAuthorizer'
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
						handler: 'src/event-listeners/my-service/product-name/something-happened.handler',
						description: 'My Service Product Name Something Happened Listener',
						events: [
							{
								http: {
									integration: 'lambda',
									path: '/listener/my-service/product-name/something-happened',
									method: 'post',
									authorizer: '${self:custom.authorizers.FullAuthorizer}',
									request: {
										template: '${self:custom.apiRequestTemplate}'
									},
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						]
					}
				});
			});

			it('Should throw an error if invalid authorizer is passed', () => {

				assert.throws(() => eventListener({}, {
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					authorizer: 'InvalidAuthorizer'
				}));
			});

			it('Should add the timeout if timeout param is passed', () => {

				assertConfig({
					serviceName: 'my service',
					entityName: 'product name',
					eventName: 'something happened',
					mustHaveClient: true,
					timeout: 20
				}, {
					'EL-MyServiceProductNameSomethingHappened': {
						name: 'EL-${self:custom.serviceName}-MyServiceProductNameSomethingHappened-${self:custom.stage}',
						handler: 'src/event-listeners/my-service/product-name/something-happened.handler',
						description: 'My Service Product Name Something Happened Listener',
						timeout: 20,
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
									response: '${self:custom.apiResponseTemplate}'
								}
							}
						]
					}
				});
			});
		});
	});

});
