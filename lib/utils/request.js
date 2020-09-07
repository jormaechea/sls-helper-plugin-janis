'use strict';

const { inspect } = require('util');

const baseTemplates = require('../templates/request');

const buildTemplates = requestTemplates => {

	if(!requestTemplates)
		return '${self:custom.apiRequestTemplate}';

	if(typeof requestTemplates !== 'object' || Array.isArray(requestTemplates))
		throw new Error(`Invalid API requestTemplates property. It must be an object. Received: ${inspect(requestTemplates)}`);

	return {
		...baseTemplates,
		...requestTemplates
	};
};

const buildRequest = ({
	requestTemplates,
	pathParameters,
	queryParameters,
	requestHeaders
}) => {

	const request = {
		template: buildTemplates(requestTemplates)
	};

	const parameters = {};

	if(pathParameters)
		parameters.paths = pathParameters;

	if(queryParameters)
		parameters.querystrings = queryParameters;

	if(requestHeaders)
		parameters.headers = requestHeaders;

	if(Object.keys(parameters).length)
		request.parameters = parameters;

	return request;
};

module.exports = {
	buildRequest
};
