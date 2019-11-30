'use strict';

const assert = require('assert').strict;

const { helper } = require('../..');

describe('Helper', () => {

	describe('Default behaviour', () => {

		it('Should return the default plugins', () => {

			const myHelper = helper();

			assert(typeof myHelper === 'object' && !Array.isArray(myHelper));
		});

		it('All plugins should be functions', () => {

			const myHelper = helper();

			assert(Object.values(myHelper).filter(plugin => typeof plugin !== 'function').length === 0);
		});

	});

});
