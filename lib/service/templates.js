'use strict';

const requestTemplate = require('../templates/request');
const response = require('../templates/response');
const offlineResponses = require('../templates/response-offline');

module.exports = ({ custom, ...serviceConfig }) => {

	return {
		...serviceConfig,
		custom: {
			...(custom || {}),
			apiRequestTemplate: requestTemplate,
			apiResponseTemplate: response,
			apiOfflineResponseTemplate: offlineResponses
		}
	};
};
