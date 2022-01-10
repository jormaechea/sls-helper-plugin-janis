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
					hookName: 'janis.apiList'
				});
			});
		});

		context('Function name', () => {
			it('Should set the correct function name', () => {

				const initialConfig = {
					provider: {}
				};

				const result = apiList({ ...initialConfig }, {
					entityName: 'product name'
				});

				assert.deepStrictEqual(result, {
					provider: {},
					functions: [{
						'APIList-ProductName': {
							name: '${self:custom.serviceName}-${self:custom.stage}-ListProductName',
							handler: 'src/lambda/RestApi/index.handler',
							description: 'Product Name List API',
							package: {
								include: [
									'src/api/product-name/list.js',
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
					}]
				});
			});
		});
	});

});
