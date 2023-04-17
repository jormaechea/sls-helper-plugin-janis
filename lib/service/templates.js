'use strict';

const requestTemplate = require('../templates/request');
const response = require('../templates/response');

module.exports = ({ custom, ...serviceConfig }) => {

	return {
		...serviceConfig,
		custom: {
			...(custom || {}),
			apiRequestTemplate: requestTemplate,
			apiResponseTemplate: response
		}
	};
};
