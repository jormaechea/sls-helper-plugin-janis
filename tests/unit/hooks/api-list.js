'use strict';

const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiList } = require('../../..');

describe('Hooks', () => {

	describe('API List', () => {

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
				pathHasId: false
			});
		});
	});

});
