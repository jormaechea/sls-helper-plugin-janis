'use strict';

const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiPut } = require('../../..');

describe('Hooks', () => {

	describe('API Put', () => {

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

});
