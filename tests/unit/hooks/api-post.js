'use strict';

const assert = require('assert');
const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiPost } = require('../../..');

describe('Hooks', () => {

	describe('API Post', () => {

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

				apiPost({ ...initialConfig });

				sinon.assert.calledOnce(apiBase.buildApi);
				sinon.assert.calledWithExactly(apiBase.buildApi, initialConfig, {
					method: 'post',
					pathHasId: false
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiPost({ ...initialConfig }, {
					entityName: 'product attribute'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'API-Create-ProductAttribute': {
							name: 'API-${self:custom.serviceName}-Create-ProductAttribute-${self:custom.stage}',
							handler: 'src/lambda/RestApi/index.handler',
							description: 'Product Attribute Post API',
							package: {
								include: [
									'src/api/product-attribute/post.js',
									'src/models/product-attribute.js'
								]
							},
							events: [
								{
									http: {
										integration: 'lambda',
										path: '/product-attribute',
										method: 'post',
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
