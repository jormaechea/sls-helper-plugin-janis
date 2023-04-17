'use strict';

const assert = require('assert');
const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiList } = require('../../..');

describe('Hooks', () => {

	describe('API List', () => {

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

				apiList({ ...initialConfig });

				sinon.assert.calledOnce(apiBase.buildApi);
				sinon.assert.calledWithExactly(apiBase.buildApi, initialConfig, {
					method: 'get',
					methodName: 'list',
					pathHasId: false,
					skipTraceLayer: true
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiList({ ...initialConfig }, {
					entityName: 'product attribute'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'API-List-ProductAttribute': {
							name: 'API-${self:custom.serviceName}-List-ProductAttribute-${self:custom.stage}',
							handler: 'src/lambda/RestApi/index.handler',
							description: 'Product Attribute List API',
							package: {
								include: [
									'src/api/product-attribute/list.js',
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
					}]
				});
			});
		});
	});

});
