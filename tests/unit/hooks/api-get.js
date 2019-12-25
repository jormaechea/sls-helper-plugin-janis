'use strict';

const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiGet } = require('../../..');

describe('Hooks', () => {

	describe('API Get', () => {

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
				pathHasId: true
			});
		});
	});

});
