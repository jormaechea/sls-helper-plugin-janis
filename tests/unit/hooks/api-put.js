'use strict';

const assert = require('assert');
const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiPut } = require('../../..');

describe('Hooks', () => {

	describe('API Put', () => {

		context('Parameter passing to base api', () => {
			beforeEach(() => {
				sinon.stub(apiBase, 'buildApi');
			});

			afterEach(() => {
				sinon.restore();
			});

			it('Should call API Base with the correct parameters', () => {

				const initialConfig = {
					provider: {}
				};

				apiPut({ ...initialConfig });

				sinon.assert.calledOnce(apiBase.buildApi);
				sinon.assert.calledWithExactly(apiBase.buildApi, initialConfig, {
					method: 'put',
					pathHasId: true
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiPut({ ...initialConfig }, {
					entityName: 'product attribute'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'API-Update-ProductAttribute': {
							name: 'API-${self:custom.serviceName}-Update-ProductAttribute-${self:custom.stage}',
							handler: 'src/api/product-attribute/put.handler',
							description: 'Product Attribute Put API',
							events: [
								{
									http: {
										integration: 'lambda',
										path: '/product-attribute/{id}',
										method: 'put',
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
					}]
				});
			});

			it('Should set a custom function name when functionName was received', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiPut({ ...initialConfig }, {
					entityName: 'product attribute',
					functionName: 'UpdateProductAttribute'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'API-UpdateProductAttribute': {
							name: 'API-${self:custom.serviceName}-UpdateProductAttribute-${self:custom.stage}',
							handler: 'src/api/product-attribute/put.handler',
							description: 'Product Attribute Put API',
							events: [
								{
									http: {
										integration: 'lambda',
										path: '/product-attribute/{id}',
										method: 'put',
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
					}]
				});
			});
		});
	});

});
