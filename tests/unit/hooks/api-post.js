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
					pathHasId: false,
					hookName: 'janis.apiPost'
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiPost({ ...initialConfig }, {
					entityName: 'product name'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'APICreate-ProductName': {
							name: '${self:custom.serviceName}-${self:custom.stage}-CreateProductName',
							handler: 'src/lambda/RestApi/index.handler',
							description: 'Product Name Post API',
							package: {
								include: [
									'src/api/product-name/post.js',
									'src/models/product-name.js'
								]
							},
							events: [
								{
									http: {
										integration: 'lambda',
										path: '/product-name',
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
					}]
				});
			});
		});
	});

});
