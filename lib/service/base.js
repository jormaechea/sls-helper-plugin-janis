'use strict';

const { inspect } = require('util');

const startcase = require('lodash.startcase');
const kebabcase = require('lodash.kebabcase');

module.exports = ({ provider, custom, package: slsPackage, ...serviceConfig }, { serviceCode, servicePort, apiSecrets }) => {

	if(!serviceCode || typeof serviceCode !== 'string')
		throw new Error(`Missing or invalid serviceCode in janis.base hook: ${inspect(serviceCode)}`);

	if(serviceCode !== kebabcase(serviceCode))
		throw new Error(`Invalid serviceCode in janis.base hook. It must be in dash-case. Received ${serviceCode}. Recommended: ${kebabcase(serviceCode)}`);

	if(!servicePort || typeof servicePort !== 'number')
		throw new Error(`Missing or invalid servicePort in janis.base hook: ${inspect(servicePort)}`);

	const serviceTitle = startcase(serviceCode);
	const serviceName = serviceTitle.replace(/ /g, '');

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
			apiName: 'JANIS ${self:custom.humanReadableStage.${self:custom.stage}} ${self:custom.serviceTitle} API',
			environment: {
				JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
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
			serviceTitle,
			serviceName,
			serviceCode,
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
				cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
			},

			janisDomains: {
				local: 'janis.localhost',
				beta: 'janisdev.in',
				qa: 'janisqa.in',
				prod: 'janis.in'
			},

			customDomain: {
				domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
				serviceName: '${self:custom.serviceCode}'
			},

			serviceApiSecret: {
				local: (apiSecrets && apiSecrets.local) || '',
				beta: (apiSecrets && apiSecrets.beta) || '',
				qa: (apiSecrets && apiSecrets.qa) || '',
				prod: (apiSecrets && apiSecrets.prod) || ''
			},

			reducer: {
				ignoreMissing: true
			},

			prune: {
				automatic: true,
				number: 3
			},

			...(custom || {})
		},
		plugins: [
			'serverless-domain-manager',
			'serverless-reqvalidator-plugin',
			'serverless-offline',
			'serverless-api-gateway-caching',
			'serverless-plugin-reducer',
			'serverless-prune-plugin',
			'serverless-plugin-stage-variables',
			'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
			'serverless-plugin-split-stacks'
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
					},

					accessDeniedResponse: {
						Type: 'AWS::ApiGateway::GatewayResponse',
						Properties: {
							ResponseParameters: {
								'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
							},
							ResponseTemplates: {
								'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
							},
							ResponseType: 'ACCESS_DENIED',
							RestApiId: {
								Ref: 'ApiGatewayRestApi'
							},
							StatusCode: '403'
						}
					}

				}
			}
		],
		...serviceConfig
	};
};
