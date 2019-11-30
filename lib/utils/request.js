'use strict';

const buildRequest = ({
	pathParameters,
	queryParameters,
	requestHeaders
}) => {

	const parameters = {
		template: '${self:custom.apiRequestTemplate}'
	};

	if(pathParameters)
		parameters.paths = pathParameters;

	if(queryParameters)
		parameters.querystrings = queryParameters;

	if(requestHeaders)
		parameters.headers = requestHeaders;

	if(Object.keys(parameters).length === 0)
		return;

	return { parameters };
};

module.exports = {
	buildRequest
};
