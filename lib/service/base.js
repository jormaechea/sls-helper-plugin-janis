'use strict';

const { inspect } = require('util');

module.exports = ({ provider, custom, package: slsPackage, ...serviceConfig }, { serviceName, servicePort }) => {

	if(!serviceName || typeof serviceName !== 'string')
		throw new Error(`Missing or invalid serviceName in janis.base hook: ${inspect(serviceName)}`);

	if(!servicePort || typeof servicePort !== 'number')
		throw new Error(`Missing or invalid servicePort in janis.base hook: ${inspect(servicePort)}`);

	const serviceNameInLowerCase = serviceName.toLowerCase();

	const { include, ...restOfPackage } = slsPackage || {};

	return {
		service: `Janis${serviceName}Service`,
		provider: {
			name: 'aws',
			runtime: 'nodejs10.x',
			memorySize: 256,
			stage: 'local',
			region: 'us-east-1',
			endpointType: 'REGIONAL',
			...(provider || {})
		},
		package: {
			include: [
				'src/config/*',
				...(include || [])
			],
			...restOfPackage
		},
		custom: {
			serviceName,
			serviceNameInLowerCase,
			stage: '${opt:stage, self:provider.stage}',
			region: '${opt:region, self:provider.region}',

			janisDomains: {
				local: 'janis.localhost',
				beta: 'janisdev.in',
				qa: 'janisqa.in',
				prod: 'janis.in'
			},

			customDomain: {
				domainName: '${self:custom.serviceNameInLowerCase}.${self:custom.janisDomains.${self:custom.stage}}',
				basePath: 'api',
				stage: '${self:custom.stage}',
				createRoute53Record: true,
				endpointType: 'regional'
			},

			apiGatewayCaching: {
				enabled: '${self:custom.cacheEnabled.${self:custom.stage}, \'false\'}',
				clusterSize: '0.5',
				ttlInSeconds: 600 // 10 minutos
			},

			'serverless-offline': {
				port: servicePort,
				host: '0.0.0.0',
				stage: 'local',
				prefix: 'api',
				printOutput: true
			},
			...(custom || {})
		},
		...serviceConfig
	};
};
