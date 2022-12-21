'use strict';

module.exports.LOG_FORMAT = {
	date: '$context.requestTime',
	reqId: '$context.requestId',
	integReqId: '$context.integration.requestId',
	ip: '$context.identity.sourceIp',
	ua: '$context.identity.userAgent',
	clientCode: '$context.authorizer.clientCode',
	principalId: '$context.authorizer.principalId',
	reqMethod: '$context.httpMethod',
	path: '$context.resourcePath',
	realPath: '$context.path',
	status: '$context.status',
	authTime: '$context.authorizer.latency',
	resTime: '$context.responseLatency',
	gwError: '$context.error.message',
	integError: '$context.integration.error'
};

module.exports.LOG_REST_API_CONFIG = {
	accessLogging: true,
	executionLogging: false,
	level: 'INFO',
	fullExecutionData: false
};
