'use strict';

const assert = require('assert').strict;

const { templates } = require('../../..');

const requestTemplate = require('../../../lib/templates/request');
const response = require('../../../lib/templates/response');
const offlineResponses = require('../../../lib/templates/response-offline');

describe('Hooks', () => {

	describe('Templates', () => {

		it('Should return the templates service configuration', () => {

			const serviceConfig = templates({});

			assert.deepStrictEqual(serviceConfig, {
				custom: {
					apiRequestTemplate: requestTemplate,
					apiResponseTemplate: response,
					apiOfflineResponseTemplate: offlineResponses
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
					apiOfflineResponseTemplate: offlineResponses,
					foo: 'bar'
				},
				otherProp: true
			});
		});
	});

});
