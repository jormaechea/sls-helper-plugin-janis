'use strict';

const sinon = require('sinon');

const apiBase = require('../../../lib/api/base');
const { apiPost } = require('../../..');

describe('Hooks', () => {

	describe('API Post', () => {

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

});
