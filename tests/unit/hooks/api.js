'use strict';

const assert = require('assert').strict;

const { api } = require('../../..');

describe('Hooks', () => {

	describe('API', () => {

		context('Config validation', () => {

			it('Should throw if path param is missing', () => {

				assert.throws(() => api({}, {}), {
					message: /path/
				});
			});

			it('Should throw if method param is passed as empty', () => {

				assert.throws(() => api({}, {
					path: '/hello-world',
					method: ''
				}), {
					message: /method/
				});
			});
		});

		context('Default configuration', () => {

			const defaultHttpEvent = {
				http: {
					integration: 'lambda',
					path: '/hello-world',
					method: 'get',
					request: {
						template: '${self:custom.apiRequestTemplate}'
					},
					response: '${self:custom.apiResponseTemplate}'
				}
			};

			it('Should return the service config with a default API config when passing the required params', () => {

				const serviceConfig = api({}, {
					path: '/hello-world'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [defaultHttpEvent]
							}
						}
					]
				});
			});

			it('Should return the service config and API config with custom function name when functionName parameter received', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					functionName: 'HelloWorld'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-HelloWorld': {
								name: 'API-${self:custom.serviceName}-HelloWorld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [defaultHttpEvent]
							}
						}
					]
				});
			});

			it('Should return the service config with a default API config and normalized path when passing the required params', () => {

				const serviceConfig = api({}, {
					path: 'hello-world/'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [defaultHttpEvent]
							}
						}
					]
				});
			});
		});

		context('Request configuration', () => {

			it('Should throw if passed request templates are not an object', () => {

				assert.throws(() => api({}, {
					path: '/hello-world',
					requestTemplates: 'not an object'
				}));

				assert.throws(() => api({}, {
					path: '/hello-world',
					requestTemplates: [{
						'application/x-www-form-urlencoded': null,
						'application/json': 'custom template',
						'x-janis-template/json': 'super custom template'
					}]
				}));
			});

			it('Should override and add the passed request templates', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					requestTemplates: {
						'application/x-www-form-urlencoded': null,
						'application/json': 'custom template',
						'x-janis-template/json': 'super custom template'
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: {
													'application/x-www-form-urlencoded': null,
													'application/json': 'custom template',
													'x-janis-template/json': 'super custom template'
												}
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should use the passed HTTP Method', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					method: 'post'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-PostHelloDashworld': {
								name: 'API-${self:custom.serviceName}-PostHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'post',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = api({}, {
					path: '/custom/{id}/path/{secondId}'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetCustomIdVarPathSecondIdVar': {
								name: 'API-${self:custom.serviceName}-GetCustomIdVarPathSecondIdVar-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/custom/{id}/path/{secondId}',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}',
												parameters: {
													paths: {
														id: true,
														secondId: true
													}
												}
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					queryParameters: {
						requiredQuery: true,
						optionalQuery: false
					},
					requestHeaders: {
						requiredHeader: true,
						optionalHeader: false
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}',
												parameters: {
													querystrings: {
														requiredQuery: true,
														optionalQuery: false
													},
													headers: {
														requiredHeader: true,
														optionalHeader: false
													}
												}
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});
		});

		context('Extra configuration', () => {

			const previousServiceConfig = {
				custom: {
					authorizers: {
						FullAuthorizer: {}
					}
				}
			};

			it('Should use the methodName param to override method for files and naming', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					method: 'get',
					methodName: 'list'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-ListHelloDashworld': {
								name: 'API-${self:custom.serviceName}-ListHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should use the handler param to override the default', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					handler: 'path/to/custom.handler'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'path/to/custom.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should enable api cache if caching param is passed', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					caching: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											caching: {
												enabled: '${self:custom.apiGatewayCaching.enabled}'
											}
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should enable cors if cors param is passed', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					cors: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											cors: '${self:custom.cors}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should set an authorizer if authorizer param is passed', () => {

				const serviceConfig = api(previousServiceConfig, {
					path: '/hello-world',
					authorizer: 'FullAuthorizer'
				});

				assert.deepStrictEqual(serviceConfig, {
					...previousServiceConfig,
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											authorizer: '${self:custom.authorizers.FullAuthorizer}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should throw an error in an invalid authorizer is passed', () => {
				assert.throws(() => api(previousServiceConfig, {
					path: '/hello-world',
					authorizer: 'InvalidAuthorizer'
				}));
			});

			it('Should set the timeout if timeout param is passed', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					timeout: 10
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								timeout: 10,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should append the package includes if package.include param is passed', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					package: { include: ['src/models/helloWorld.js'] }
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/models/helloWorld.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}'
										}
									}
								]
							}
						}
					]
				});
			});

			it('Should set raw props in the function end event configuration if they are passed', () => {

				const serviceConfig = api({}, {
					path: '/hello-world',
					functionRawProps: {
						foo: 'bar',
						description: 'Override it'
					},
					eventRawProps: {
						someProp: 'custom'
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: 'API-${self:custom.serviceName}-GetHelloDashworld-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Override it',
								foo: 'bar',
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}'
											},
											response: '${self:custom.apiResponseTemplate}',
											someProp: 'custom'
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
