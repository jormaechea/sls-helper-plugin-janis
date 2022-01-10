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
					pathHasId: true,
					hookName: 'janis.apiPut'
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiPut({ ...initialConfig }, {
					entityName: 'product name'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'APIUpdate-ProductName': {
							name: '${self:custom.serviceName}-${self:custom.stage}-UpdateProductName',
							handler: 'src/lambda/RestApi/index.handler',
							description: 'Product Name Put API',
							package: {
								include: [
									'src/api/product-name/put.js',
									'src/models/product-name.js'
								]
							},
							events: [
								{
									http: {
										integration: 'lambda',
										path: '/product-name/{id}',
										method: 'put',
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
					}]
				});
			});
		});
	});

});
