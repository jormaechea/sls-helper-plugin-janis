'use strict';

const { inspect } = require('util');

const startcase = require('lodash.startcase');
const kebabcase = require('../utils/kebabcase');

const { LOG_FORMAT, LOG_REST_API_CONFIG } = require('../utils/api-gateway-logs-defaults');

const defaultInclude = [
	'src/config/*'
];

const defaultExclude = [
	'.nyc_output/**',
	'.bitbucket/**',
	'.deploy/**',
	'.husky/**',
	'view-schemas/**',
	'view-schemas-built/**',
	'view-schemas-built-local/**',
	'tests/**',
	'test-reports/**',
	'hooks/**',
	'events/**',
	'permissions/**',
	'schemas/src/**',
	'serverless/**',
	'src/environments/**',
	'*',
	'.*',
	'node_modules/.cache/**',
	'node_modules/**/README.md',
	'node_modules/**/.github/**',
	'node_modules/**/CHANGELOG.md',
	'node_modules/**/LICENSE',
	'node_modules/**/*.js.map',
	'node_modules/**/*.map',
	'node_modules/**/*.min.map',
	'node_modules/**/*.js.flow',
	'node_modules/**/*.d.ts',
	'node_modules/ajv/dist/**',
	'node_modules/**/ajv/dist/**',
	'node_modules/aws-sdk/**',
	'node_modules/**/aws-sdk/**',
	'node_modules/sinon/**',
	'node_modules/serverless/**',
	'node_modules/@serverless/**',
	'node_modules/@babel/**',
	'node_modules/eslint-plugin-import/**',
	'node_modules/@sinonjs/**',
	'node_modules/faker/dist/**',
	'node_modules/date-fns/esm/**',
	'node_modules/date-fns/fp/**',
	'node_modules/**/date-fns/docs/**',
	'node_modules/**/buffer/test/**',
	'node_modules/**/jmespath/test/**',
	'node_modules/**/qs/test/**',
	'node_modules/**/qs/dist/**',
	'node_modules/**/bson/browser_build/**',
	'node_modules/**/axios/dist/**'
];

const defaultPlugins = [
	'serverless-domain-manager',
	'serverless-offline',
	'serverless-api-gateway-caching',
	'serverless-plugin-stage-variables',
	'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
	'serverless-plugin-split-stacks'
];

const gatewayResponseTemplate = `
	{"message":$context.error.messageString,"detail":"$context.authorizer.errorMessage","authorizerErrorType":"$context.error.responseType"}
`.trim();

module.exports = ({
	provider,
	custom,
	package: slsPackage,
	plugins,
	pluginsOnly,
	...serviceConfig
}, { serviceCode, servicePort, apiSecrets }) => {

	if(!serviceCode || typeof serviceCode !== 'string')
		throw new Error(`Missing or invalid serviceCode in janis.base hook: ${inspect(serviceCode)}`);

	if(serviceCode !== kebabcase(serviceCode))
		throw new Error(`Invalid serviceCode in janis.base hook. It must be in dash-case. Received ${serviceCode}. Recommended: ${kebabcase(serviceCode)}`);

	if(!servicePort || typeof servicePort !== 'number')
		throw new Error(`Missing or invalid servicePort in janis.base hook: ${inspect(servicePort)}`);

	const serviceTitle = startcase(serviceCode);
	const serviceName = serviceTitle.replace(/ /g, '');

	const {
		include,
		includeOnly,
		exclude,
		excludeOnly,
		...restOfPackage
	} = slsPackage || {};

	const finalExclude = excludeOnly || [
		...defaultExclude,
		...(exclude || [])
	];

	const finalInclude = includeOnly || [
		...defaultInclude,
		...(include || [])
	];

	const finalPlugins = pluginsOnly || [
		...defaultPlugins,
		...(plugins || [])
	];

	return {
		service: 'Janis${self:custom.serviceName}Service',
		provider: {
			name: 'aws',
			runtime: 'nodejs14.x',
			memorySize: 1024,
			stage: '${opt:stage, \'local\'}',
			region: '${opt:region, \'us-east-1\'}',
			role: 'ServiceExecutionRole',
			endpointType: 'REGIONAL',
			apiName: 'JANIS ${self:custom.humanReadableStage.${self:custom.stage}} ${self:custom.serviceTitle} API',
			logRetentionInDays: 14,
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
			versionFunctions: false,
			apiGateway: {
				disableDefaultEndpoint: true
			},
			logs: {
				restApi: {
					...LOG_REST_API_CONFIG,
					format: JSON.stringify(LOG_FORMAT)
				}
			},
			...(provider || {})
		},
		package: {
			individually: false,
			include: finalInclude,
			exclude: finalExclude,
			...restOfPackage
		},
		custom: {
			serviceTitle,
			serviceName,
			serviceCode,
			stage: '${self:provider.stage}',
			region: '${self:provider.region}',

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
				endpointType: 'regional',
				securityPolicy: 'tls_1_2'
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

			...(custom || {})
		},
		plugins: finalPlugins,
		resources: {
			Resources: {

				ServiceExecutionRole: {
					Type: 'AWS::IAM::Role',
					Properties: {
						RoleName: 'Janis${self:custom.serviceName}Service-${self:custom.stage}-lambdaRole',
						Path: '/janis-service/',
						AssumeRolePolicyDocument: {
							Version: '2012-10-17',
							Statement: [
								{
									Effect: 'Allow',
									Principal: {
										Service: [
											'lambda.amazonaws.com'
										]
									},
									Action: 'sts:AssumeRole'
								}
							]
						},
						// If VPC is configured, it must include this managed policy
						...(provider && provider.vpc ? { ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'] } : {}),
						Policies: [
							{
								PolicyName: 'janis-${self:custom.serviceCode}-logs-policy',
								PolicyDocument: {
									Version: '2012-10-17',
									Statement: [
										{
											Effect: 'Allow',
											Action: [
												'logs:CreateLogGroup',
												'logs:CreateLogStream',
												'logs:PutLogEvents'
											],
											Resource: [
												{
													'Fn::Join': [
														':',
														[
															'arn:aws:logs',
															{ Ref: 'AWS::Region' },
															{ Ref: 'AWS::AccountId' },
															'log-group:/aws/lambda/*:*'
														]
													]
												},
												{
													'Fn::Join': [
														':',
														[
															'arn:aws:logs',
															{ Ref: 'AWS::Region' },
															{ Ref: 'AWS::AccountId' },
															'log-group:/aws/lambda/*:*:*'
														]
													]
												}
											]
										}
									]
								}
							}
						]
					}
				},

				UnauthorizedResponse: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': '{"message":$context.error.messageString,"authorizerErrorType":"$context.error.responseType"}'
						},
						ResponseType: 'UNAUTHORIZED',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '401'
					}
				},

				BadRequestBodyResponse: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': gatewayResponseTemplate
						},
						ResponseType: 'BAD_REQUEST_BODY',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '400'
					}
				},

				BadRequestParameters: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': gatewayResponseTemplate
						},
						ResponseType: 'BAD_REQUEST_PARAMETERS',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '400'
					}
				},

				AccessDeniedResponse: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': gatewayResponseTemplate
						},
						ResponseType: 'ACCESS_DENIED',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '403'
					}
				},

				AuthorizerConfigurationErrorResponse: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': gatewayResponseTemplate
						},
						ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '500'
					}
				},

				AuthorizerFailureResponse: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': gatewayResponseTemplate
						},
						ResponseType: 'AUTHORIZER_FAILURE',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '500'
					}
				},

				IntegrationTimeoutResponse: {
					Type: 'AWS::ApiGateway::GatewayResponse',
					Properties: {
						ResponseParameters: {
							'gatewayresponse.header.Access-Control-Allow-Origin': 'method.request.header.Origin'
						},
						ResponseTemplates: {
							'application/json': '{"message":"Timeout","authorizerErrorType":"$context.error.responseType"}'
						},
						ResponseType: 'INTEGRATION_TIMEOUT',
						RestApiId: {
							Ref: 'ApiGatewayRestApi'
						},
						StatusCode: '504'
					}
				}

			}
		},
		...serviceConfig
	};
};
