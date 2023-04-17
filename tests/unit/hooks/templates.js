'use strict';

const assert = require('assert').strict;

const { templates } = require('../../..');

const requestTemplate = require('../../../lib/templates/request');
const response = require('../../../lib/templates/response');

describe('Hooks', () => {

	describe('Templates', () => {

		it('Should return the templates service configuration', () => {

			const serviceConfig = templates({});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					apiRequestTemplate: requestTemplate,
					apiResponseTemplate: response
				}
			});
		});

		it('Should not override other configurations', () => {

			const serviceConfig = templates({
				custom: {
					foo: 'bar'
				},
				otherProp: true
			});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					apiRequestTemplate: requestTemplate,
					apiResponseTemplate: response,
					foo: 'bar'
				},
				otherProp: true
			});
		});
	});

});
