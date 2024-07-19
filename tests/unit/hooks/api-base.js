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
					entityName: 'product-attribute',
					method: ''
				}), {
					message: /method/
				});
			});
		});

		context('Default configuration', () => {
			it('Should return the service config with a default API config when passing the required params', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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
		});

		context('Path configuration', () => {

			it('Should use a custom path if path param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					path: '/custom/path'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
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
											response: '${self:custom.apiResponseTemplate}'
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
					entityName: 'product attribute',
					pathHasId: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute/{id}',
											method: 'get',
											request: {
												template: '${self:custom.apiRequestTemplate}',
												parameters: {
													paths: {
														id: true
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

		context('Request configuration', () => {

			it('Should throw if passed request templates are not an object', () => {

				assert.throws(() => apiBase.buildApi({}, {
					entityName: 'product attribute',
					requestTemplates: 'not an object'
				}));

				assert.throws(() => apiBase.buildApi({}, {
					entityName: 'product attribute',
					requestTemplates: [{
						'application/x-www-form-urlencoded': null,
						'application/json': 'custom template',
						'x-janis-template/json': 'super custom template'
					}]
				}));

			});

			it('Should override and add the passed request templates', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					requestTemplates: {
						'application/x-www-form-urlencoded': null,
						'application/json': 'custom template',
						'x-janis-template/json': 'super custom template'
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					path: '/custom/{id}/path/{secondId}'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					methodName: 'custom'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Custom-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Custom-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Custom API',
								package: {
									include: [
										'src/api/product-attribute/custom.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					handler: 'path/to/custom.handler'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'path/to/custom.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					caching: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
											method: 'get',
											caching: {
												enabled: '${self:custom.apiGatewayCaching.enabled}'
											},
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

			it('Should enable default cors if cors param is passed as true', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					cors: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
											method: 'get',
											cors: '${self:custom.cors}',
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

			it('Should enable customized cors if cors param is passed as an object', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					cors: {
						replace: true,
						origins: ['*'],
						allowCredentials: false
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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
													'x-janis-totals',
													'x-janis-only-totals',
													'x-janis-page',
													'x-janis-page-size'
												],
												allowCredentials: false,
												maxAge: 600
											},
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

			it('Should set an authorizer if authorizer param is passed', () => {

				const serviceConfig = apiBase.buildApi(previousServiceConfig, {
					entityName: 'product attribute',
					authorizer: 'FullAuthorizer'
				});

				assert.deepStrictEqual(serviceConfig, {
					...previousServiceConfig,
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
											method: 'get',
											authorizer: '${self:custom.authorizers.FullAuthorizer}',
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

			it('Should throw an error in an invalid authorizer is passed', () => {
				assert.throws(() => apiBase.buildApi(previousServiceConfig, {
					entityName: 'product attribute',
					authorizer: 'InvalidAuthorizer'
				}));
			});

			it('Should set the timeout if timeout param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					timeout: 10
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								timeout: 10,
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					package: { include: ['src/controllers/product.js'] }
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js',
										'src/controllers/product.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Override it',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								foo: 'bar',
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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
					entityName: 'product attribute',
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [
									'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1'
								],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								environment: {
									JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
									JANIS_ENV: '${self:custom.stage}',
									MS_PATH: 'src'
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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
					entityName: 'product attribute',
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								environment: {
									JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
									JANIS_ENV: '${self:custom.stage}',
									MS_PATH: 'src'
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should set the layers as an empty array if skipTraceLayer is true and there were no layers set', () => {

				sinon.stub(process, 'env')
					.value({
						...process.env,
						TRACE_ACCOUNT_ID: '012345678910',
						JANIS_TRACE_EXTENSION_VERSION: '1'
					});

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product attribute',
					skipTraceLayer: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								environment: {
									JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
									JANIS_ENV: '${self:custom.stage}',
									MS_PATH: 'src'
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should set the layers as an empty array if empty custom layers are set and skipTraceLayer is true', () => {

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
					entityName: 'product attribute',
					layers: [],
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								environment: {
									JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
									JANIS_ENV: '${self:custom.stage}',
									MS_PATH: 'src'
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should set the trace layer if empty custom layers are set and skipTraceLayer is not true', () => {

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
					entityName: 'product attribute',
					layers: [],
					skipTraceLayer: false
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [getTraceLayerArn()],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should set the trace layer and custom layers if custom layers are set and skipTraceLayer is not true', () => {

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
					entityName: 'product attribute',
					layers: ['CustomLayer'],
					skipTraceLayer: false
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [
									getTraceLayerArn(),
									'CustomLayer'
								],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should not prepend the trace layer to custom layers if trace env vars are not set', () => {

				sinon.stub(process, 'env')
					.value({
						...process.env,
						TRACE_ACCOUNT_ID: '',
						JANIS_TRACE_EXTENSION_VERSION: ''
					});

				const serviceConfig = apiBase.buildApi({
					provider: {
						layers: [
							'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1'
						]
					}
				}, {
					entityName: 'product attribute',
					layers: ['CustomLayer'],
					skipTraceLayer: false
				});

				assert.deepStrictEqual(serviceConfig, {
					provider: {
						layers: [
							'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1'
						]
					},
					functions: [
						{
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [
									'CustomLayer'
								],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should append custom layers to the default ones if addLayers is set', () => {

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
					entityName: 'product attribute',
					addLayers: ['CustomLayer'],
					skipTraceLayer: false
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [
									getTraceLayerArn(),
									'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1',
									'CustomLayer'
								],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should append custom layers to the default ones without the trace later if addLayers is set and skipTraceLayer is true', () => {

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
					entityName: 'product attribute',
					addLayers: ['CustomLayer'],
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								layers: [
									'arn:aws:lambda:us-east-1:123456789123:layer:other-layer:1',
									'CustomLayer'
								],
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								environment: {
									JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
									JANIS_ENV: '${self:custom.stage}',
									MS_PATH: 'src'
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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

			it('Should not set function layers if layers is not set, addLayers is not set or empty and skipTraceLayer is false', () => {

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
					entityName: 'product attribute',
					layers: null,
					addLayers: [],
					skipTraceLayer: false
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
							'API-Get-ProductAttribute': {
								name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
								handler: 'src/lambda/RestApi/index.handler',
								description: 'Product Attribute Get API',
								package: {
									include: [
										'src/api/product-attribute/get.js',
										'src/models/product-attribute.js'
									]
								},
								events: [
									{
										http: {
											integration: 'lambda',
											path: '/product-attribute',
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
		});
	});

});
