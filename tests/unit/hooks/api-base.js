'use strict';

const assert = require('assert').strict;
const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { getTraceLayerArn } = require('../../../lib/utils/trace-layer');

describe('Internal Hooks', () => {

	describe('API Base', () => {

		context('Config validation', () => {

			it('Should throw if entityName param is missing', () => {

				assert.throws(() => apiBase.buildApi({}, {}), {
					message: /entityName/
				});
			});

			it('Should throw if method param is passed as empty', () => {

				assert.throws(() => apiBase.buildApi({}, {
					entityName: 'product-name',
					method: ''
				}), {
					message: /method/
				});
			});
		});

		context('Default configuration', () => {
			it('Should return the service config with a default API config when passing the required params', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

		context('Path configuration', () => {

			it('Should use a custom path if path param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					path: '/custom/path'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/custom/path',
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

			it('Should add the id variable if pathHasId param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					pathHasId: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name/{id}',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}',
												parameters: {
													paths: {
														id: true
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

		context('Request configuration', () => {

			it('Should throw if passed request templates are not an object', () => {

				assert.throws(() => apiBase.buildApi({}, {
					entityName: 'product name',
					requestTemplates: 'not an object'
				}));

				assert.throws(() => apiBase.buildApi({}, {
					entityName: 'product name',
					requestTemplates: [{
						'application/x-www-form-urlencoded': null,
						'application/json': 'custom template',
						'x-janis-template/json': 'super custom template'
					}]
				}));

			});

			it('Should override and add the passed request templates', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					requestTemplates: {
						'application/x-www-form-urlencoded': null,
						'application/json': 'custom template',
						'x-janis-template/json': 'super custom template'
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					path: '/custom/{id}/path/{secondId}'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
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
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					methodName: 'custom'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APICustom-ProductName': {
								name: 'APICustom-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Custom API',
								package: {
									include: [
										'src/api/product-name/custom.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					handler: 'path/to/custom.handler'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'path/to/custom.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					caching: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
											method: 'get',
											caching: {
												enabled: '${self:custom.apiGatewayCaching.enabled}'
											},
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

			it('Should enable default cors if cors param is passed as true', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					cors: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
											method: 'get',
											cors: '${self:custom.cors}',
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

			it('Should enable customized cors if cors param is passed as an object', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					cors: {
						replace: true,
						origins: ['*'],
						allowCredentials: false
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
											method: 'get',
											cors: {
												origins: ['*'],
												headers: [
													'authorization',
													'content-type',
													'janis-api-key',
													'janis-api-secret',
													'janis-client',
													'janis-service',
													'janis-entity',
													'janis-entity-id',
													'x-api-key',
													'x-janis-page',
													'x-janis-page-size'
												],
												allowCredentials: false,
												maxAge: 600
											},
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

			it('Should set an authorizer if authorizer param is passed', () => {

				const serviceConfig = apiBase.buildApi(previousServiceConfig, {
					entityName: 'product name',
					authorizer: 'FullAuthorizer'
				});

				assert.deepStrictEqual(serviceConfig, {
					...previousServiceConfig,
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
											method: 'get',
											authorizer: '${self:custom.authorizers.FullAuthorizer}',
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

			it('Should throw an error in an invalid authorizer is passed', () => {
				assert.throws(() => apiBase.buildApi(previousServiceConfig, {
					entityName: 'product name',
					authorizer: 'InvalidAuthorizer'
				}));
			});

			it('Should set the timeout if timeout param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					timeout: 10
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								timeout: 10,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					package: { include: ['src/controllers/product.js'] }
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js',
										'src/controllers/product.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
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
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Override it',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								foo: 'bar',
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

			it('Should set the provider layers without the trace layer if skipTraceLayer is true', () => {

				sinon.stub(process, 'env')
					.value({
						...process.env,
						TRACE_ACCOUNT_ID: '012345678910',
						JANIS_TRACE_EXTENSION_VERSION: '1'
					});

				const serviceConfig = apiBase.buildApi({
					provider: {
						layers: [
							getTraceLayerArn(),
							'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1'
						]
					}
				}, {
					entityName: 'product name',
					skipTraceLayer: true
				});

				assert.deepStrictEqual(serviceConfig, {
					provider: {
						layers: [
							getTraceLayerArn(),
							'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1'
						]
					},
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [
									'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1'
								],
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

			it('Should set the layers as an empty array if skipTraceLayer is true and it was the only layer', () => {

				sinon.stub(process, 'env')
					.value({
						...process.env,
						TRACE_ACCOUNT_ID: '012345678910',
						JANIS_TRACE_EXTENSION_VERSION: '1'
					});

				const serviceConfig = apiBase.buildApi({
					provider: {
						layers: [
							getTraceLayerArn()
						]
					}
				}, {
					entityName: 'product name',
					skipTraceLayer: true
				});

				assert.deepStrictEqual(serviceConfig, {
					provider: {
						layers: [
							getTraceLayerArn()
						]
					},
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [],
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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

			it('Should set the layers as an empty array if skipTraceLayer is true and there were no layers set', () => {

				sinon.stub(process, 'env')
					.value({
						...process.env,
						TRACE_ACCOUNT_ID: '012345678910',
						JANIS_TRACE_EXTENSION_VERSION: '1'
					});

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					skipTraceLayer: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'APIGet-ProductName': {
								name: 'APIGet-${self:custom.serviceName}-ProductName-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [],
								description: 'Product Name Get API',
								package: {
									include: [
										'src/api/product-name/get.js',
										'src/models/product-name.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-name',
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
	});

});
