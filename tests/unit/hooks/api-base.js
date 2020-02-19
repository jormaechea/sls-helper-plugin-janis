'use strict';

const assert = require('assert').strict;

const apiBase = require('../../../lib/api/base');

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
							ProductNameGetApi: {
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
							ProductNameGetApi: {
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
							ProductNameGetApi: {
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

			it('Should parse path parameters and add them to request parameters object', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					path: '/custom/{id}/path/{secondId}'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							ProductNameGetApi: {
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
							ProductNameGetApi: {
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

			it('Should use the methodName param to override method for files and naming', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					methodName: 'custom'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							ProductNameCustomApi: {
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
							ProductNameGetApi: {
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
							ProductNameGetApi: {
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

			it('Should enable cors if cors param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					cors: true
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							ProductNameGetApi: {
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

			it('Should set an authorizer if authorizer param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					authorizer: 'FullAuthorizer'
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							ProductNameGetApi: {
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

			it('Should set the timeout if timeout param is passed', () => {

				const serviceConfig = apiBase.buildApi({}, {
					entityName: 'product name',
					timeout: 10
				});

				assert.deepStrictEqual(serviceConfig, {
					functions: [
						{
							ProductNameGetApi: {
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
							ProductNameGetApi: {
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
		});
	});

});
