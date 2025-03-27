'use strict';

const assert = require('assert');
const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiGet } = require('../../..');

describe('Hooks', () => {

	describe('API Get', () => {

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

				apiGet({ ...initialConfig });

				sinon.assert.calledOnce(apiBase.buildApi);
				sinon.assert.calledWithExactly(apiBase.buildApi, initialConfig, {
					method: 'get',
					pathHasId: true,
					skipTraceLayer: true
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiGet({ ...initialConfig }, {
					entityName: 'product attribute'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'API-Get-ProductAttribute': {
							name: 'API-${self:custom.serviceName}-Get-ProductAttribute-${self:custom.stage}',
							handler: 'src/api/product-attribute/get.handler',
							description: 'Product Attribute Get API',
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
					}]
				});
			});
		});
	});

});
