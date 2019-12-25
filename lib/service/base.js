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
		service: 'Janis${self:custom.serviceName}Service',
		provider: {
			name: 'aws',
			runtime: 'nodejs12.x',
			memorySize: 256,
			stage: 'local',
			region: 'us-east-1',
			endpointType: 'REGIONAL',
			apiName: 'JANIS ${self:custom.humanReadableStage.${self:custom.stage}} ${self:custom.serviceName} API',
			environment: {
				JANIS_SERVICE_NAME: '${self:custom.serviceNameInLowerCase}',
				JANIS_SERVICE_SECRET: '${self:custom.serviceApiSecret.${self:custom.stage}}',
				JANIS_ENV: '${self:custom.stage}',
				MS_PATH: 'src'
			},
			tags: {
				Owner: 'Janis',
				Microservice: '${self:custom.serviceName}',
				Stack: '${self:custom.humanReadableStage.${self:custom.stage}}'
			},
			iamRoleStatements: [
				{
					Effect: 'Allow',
					Action: [
						's3:PutObject'
					],
					Resource: [
						'arn:aws:s3:::janis-trace-service-${self:custom.stage}/*'
					]
				}
			],
			...(provider || {})
		},
		package: {
			individually: true,
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

			humanReadableStage: {
				local: 'Local',
				beta: 'Beta',
				qa: 'QA',
				prod: 'Prod'
			},

			'serverless-offline': {
				port: servicePort,
				host: '0.0.0.0',
				stage: 'local',
				prefix: 'api',
				printOutput: true,
				cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb|mysql)])'
			},

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

			cacheEnabled: {
				prod: false
			},

			apiGatewayCaching: {
				enabled: '${self:custom.cacheEnabled.${self:custom.stage}, \'false\'}',
				clusterSize: '0.5',
				ttlInSeconds: 600 // 10 minutos
			},

			stageVariables: {
				serviceName: '${self:custom.serviceNameInLowerCase}'
			},

			serviceApiSecret: {
				local: '',
				beta: '',
				qa: '',
				prod: ''
			},

			reducer: {
				ignoreMissing: true
			},

			...(custom || {})
		},
		plugins: [
			'serverless-domain-manager',
			'serverless-reqvalidator-plugin',
			'serverless-offline',
			'serverless-api-gateway-caching',
			'serverless-plugin-reducer',
			'serverless-plugin-stage-variables'
		],
		resources: [
			{
				Resources: {

					unauthorizedResponse: {
						Type: 'AWS::ApiGateway::GatewayResponse',
						Properties: {
							ResponseParameters: {
								'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
							},
							ResponseTemplates: {
								'application/json': '{"message":$context.error.messageString}'
							},
							ResponseType: 'UNAUTHORIZED',
							RestApiId: {
								Ref: 'ApiGatewayRestApi'
							},
							StatusCode: '401'
						}
					},

					badRequestBodyResponse: {
						Type: 'AWS::ApiGateway::GatewayResponse',
						Properties: {
							ResponseParameters: {
								'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
							},
							ResponseTemplates: {
								'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
							},
							ResponseType: 'BAD_REQUEST_BODY',
							RestApiId: {
								Ref: 'ApiGatewayRestApi'
							},
							StatusCode: '400'
						}
					},

					badRequestParameters: {
						Type: 'AWS::ApiGateway::GatewayResponse',
						Properties: {
							ResponseParameters: {
								'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
							},
							ResponseTemplates: {
								'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
							},
							ResponseType: 'BAD_REQUEST_PARAMETERS',
							RestApiId: {
								Ref: 'ApiGatewayRestApi'
							},
							StatusCode: '400'
						}
					}

				}
			}
		],
		...serviceConfig
	};
};
