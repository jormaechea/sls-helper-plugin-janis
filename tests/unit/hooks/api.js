'use strict';

const assert = require('assert').strict;

const { api } = require('../../..');

describe('Hooks', () => {

	describe('API', () => {

		context('Config validation', () => {

			it('Should throw if path param is missing', () => {

				assert.throws(() => api({}, {
					name: 'MyApi'
				}), {
					message: /path/
				});
			});
			it('Should throw if name param is missing', () => {

				assert.throws(() => api({}, {
					path: '/hello-world'
				}), {
					message: /name/
				});
			});

			it('Should throw if method param is passed as empty', () => {

				assert.throws(() => api({}, {
					name: 'MyApi',
					path: '/hello-world',
					method: ''
				}), {
					message: /method/
				});
			});
		});

		context('Default configuration', () => {
			it('Should return the service config with a default API config when passing the required params', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/hello-world'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
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

			it('Should return the service config with a default API config and normalized path when passing the required params', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: 'hello-world/'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
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

		context('Request configuration', () => {

			it('Should throw if passed request templates are not an object', () => {

				assert.throws(() => api({}, {
					name: 'HelloWorld',
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
					name: 'HelloWorld',
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
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
									]
								},
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

			it('Should use the passed HTTP Method', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/hello-world',
					method: 'post'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-PostHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/post.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/hello-world',
											method: 'post',
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

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/custom/{id}/path/{secondId}'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetCustomIdVarPathSecondIdVar': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/custom/path/get.js'
									]
								},
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

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
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
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
									]
								},
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
					name: 'HelloWorld',
					path: '/hello-world',
					method: 'get',
					methodName: 'list'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-ListHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/list.js'
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

			it('Should use the handler param to override the default', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/hello-world',
					handler: 'path/to/custom.handler'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'path/to/custom.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
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

			it('Should enable api cache if caching param is passed', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/hello-world',
					caching: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
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
											response: '${self:custom.apiResponseTemplate}',
											responses: '${self:custom.apiOfflineResponseTemplate}',
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
					name: 'HelloWorld',
					path: '/hello-world',
					cors: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
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
											response: '${self:custom.apiResponseTemplate}',
											responses: '${self:custom.apiOfflineResponseTemplate}',
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
					name: 'HelloWorld',
					path: '/hello-world',
					authorizer: 'FullAuthorizer'
				});

				assert.deepStrictEqual(serviceConfig, {
					...previousServiceConfig,
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
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
											response: '${self:custom.apiResponseTemplate}',
											responses: '${self:custom.apiOfflineResponseTemplate}',
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
					name: 'HelloWorld',
					path: '/hello-world',
					authorizer: 'InvalidAuthorizer'
				}));
			});

			it('Should set the timeout if timeout param is passed', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/hello-world',
					timeout: 10
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js'
									]
								},
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

			it('Should append the package includes if package.include param is passed', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
					path: '/hello-world',
					package: { include: ['src/models/helloWorld.js'] }
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-GetHelloDashworld': {
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: undefined,
								package: {
									include: [
										'src/api/hello-world/get.js',
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

			it('Should set raw props in the function end event configuration if they are passed', () => {

				const serviceConfig = api({}, {
					name: 'HelloWorld',
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
								name: '${self:custom.serviceName}-${self:custom.stage}-HelloWorld',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Override it',
								package: {
									include: [
										'src/api/hello-world/get.js'
									]
								},
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
											responses: '${self:custom.apiOfflineResponseTemplate}',
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
