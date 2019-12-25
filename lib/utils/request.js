'use strict';

const buildRequest = ({
	pathParameters,
	queryParameters,
	requestHeaders
}) => {

	const request = {
		template: '${self:custom.apiRequestTemplate}'
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
