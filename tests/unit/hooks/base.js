'use strict';

const assert = require('assert').strict;

const { base } = require('../../..');

describe('Hooks', () => {

	describe('Base service', () => {

		const validServicePort = 3000;

		it('Should throw if serviceCode hook config is not defined', () => {
			assert.throws(() => base({}, {
				servicePort: validServicePort
			}));
		});

		it('Should throw if serviceCode hook config is not a string', () => {
			assert.throws(() => base({}, {
				serviceCode: ['invalid'],
				servicePort: validServicePort
			}));
		});

		it('Should throw if serviceCode hook config is not in dash-case', () => {

			[
				'SomeInvalidCode',
				'Some Invalid Code'
			].forEach(serviceCode => {
				assert.throws(() => base({}, {
					serviceCode,
					servicePort: validServicePort
				}));
			});
		});

		it('Should throw if servicePort hook config is not defined', () => {
			assert.throws(() => base({}, {
				serviceCode: 'testing'
			}));
		});

		it('Should throw if servicePort hook config is not a string', () => {
			assert.throws(() => base({}, {
				serviceCode: 'testing',
				servicePort: ['invalid']
			}));
		});

		it('Should not throw if a valid serviceCode and servicePort is received', () => {

			[
				'valid-code',
				'123',
				'123-valid-code',
				'valid-123-code',
				'123-valid-code-456',
				'valid-code-special-chars-àá'
			].forEach(serviceCode => {
				assert.doesNotThrow(() => base({}, {
					serviceCode,
					servicePort: validServicePort
				}));
			});
		});

		it('Should return the base service configuration', () => {

			const serviceConfig = base({}, {
				serviceCode: 'testing',
				servicePort: validServicePort
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
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
					versionFunctions: false
				},
				package: {
					individually: false,
					include: [
						'src/config/*'
					],
					exclude: [
						'.nyc_output/**',
						'view-schemas/**',
						'view-schemas-built/**',
						'tests/**',
						'hooks/**',
						'events/**',
						'permissions/**',
						'schemas/src/**',
						'serverless/**',
						'src/environments/**',
						'*',
						'.*',
						'node_modules/aws-sdk/**',
						'node_modules/**/aws-sdk/**',
						'node_modules/sinon/**',
						'node_modules/serverless/**',
						'node_modules/@serverless/**',
						'node_modules/@babel/**',
						'node_modules/eslint-plugin-import/**',
						'node_modules/@sinonjs/**'
					]
				},
				custom: {
					serviceTitle: 'Testing',
					serviceName: 'Testing',
					serviceCode: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					humanReadableStage: {
						local: 'Local',
						beta: 'Beta',
						qa: 'QA',
						prod: 'Prod'
					},

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					cacheEnabled: {
						prod: false
					},

					customDomain: {
						domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceCode}'
					},

					serviceApiSecret: {
						local: '',
						beta: '',
						qa: '',
						prod: ''
					},

					reducer: {
						ignoreMissing: true
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-stage-variables',
					'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
					'serverless-plugin-split-stacks'
				],
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
									'application/json': '{"message":$context.error.messageString}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
								},
								ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
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
									'application/json': '{"message":"Timeout"}'
								},
								ResponseType: 'INTEGRATION_TIMEOUT',
								RestApiId: {
									Ref: 'ApiGatewayRestApi'
								},
								StatusCode: '504'
							}
						}

					}
				}
			});
		});

		it('Should not override the original configuration', () => {

			const serviceConfig = base({
				provider: {
					logRetentionInDays: 30
				},
				custom: {
					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,
				package: {
					individually: false,
					include: [
						'custom/path/**'
					],
					exclude: [
						'something'
					]
				},
				plugins: [
					'some-custom-plugin'
				]
			}, {
				serviceCode: 'testing',
				servicePort: validServicePort
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
					role: 'ServiceExecutionRole',
					endpointType: 'REGIONAL',
					apiName: 'JANIS ${self:custom.humanReadableStage.${self:custom.stage}} ${self:custom.serviceTitle} API',
					logRetentionInDays: 30,
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
					versionFunctions: false
				},
				package: {
					individually: false,
					include: [
						'src/config/*',
						'custom/path/**'
					],
					exclude: [
						'.nyc_output/**',
						'view-schemas/**',
						'view-schemas-built/**',
						'tests/**',
						'hooks/**',
						'events/**',
						'permissions/**',
						'schemas/src/**',
						'serverless/**',
						'src/environments/**',
						'*',
						'.*',
						'node_modules/aws-sdk/**',
						'node_modules/**/aws-sdk/**',
						'node_modules/sinon/**',
						'node_modules/serverless/**',
						'node_modules/@serverless/**',
						'node_modules/@babel/**',
						'node_modules/eslint-plugin-import/**',
						'node_modules/@sinonjs/**',
						'something'
					]
				},
				custom: {
					serviceTitle: 'Testing',
					serviceName: 'Testing',
					serviceCode: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					humanReadableStage: {
						local: 'Local',
						beta: 'Beta',
						qa: 'QA',
						prod: 'Prod'
					},

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					cacheEnabled: {
						prod: false
					},

					customDomain: {
						domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceCode}'
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

					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,

				plugins: [
					'serverless-domain-manager',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-stage-variables',
					'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
					'serverless-plugin-split-stacks',
					'some-custom-plugin'
				],
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
									'application/json': '{"message":$context.error.messageString}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
								},
								ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
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
									'application/json': '{"message":"Timeout"}'
								},
								ResponseType: 'INTEGRATION_TIMEOUT',
								RestApiId: {
									Ref: 'ApiGatewayRestApi'
								},
								StatusCode: '504'
							}
						}
					}
				}
			});
		});

		it('Should use original configuration to override hook defaults', () => {

			const serviceConfig = base({
				provider: {
					memorySize: 512
				}
			}, {
				serviceCode: 'testing',
				servicePort: validServicePort
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 512,
					stage: 'local',
					region: 'us-east-1',
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
					versionFunctions: false
				},
				package: {
					individually: false,
					include: [
						'src/config/*'
					],
					exclude: [
						'.nyc_output/**',
						'view-schemas/**',
						'view-schemas-built/**',
						'tests/**',
						'hooks/**',
						'events/**',
						'permissions/**',
						'schemas/src/**',
						'serverless/**',
						'src/environments/**',
						'*',
						'.*',
						'node_modules/aws-sdk/**',
						'node_modules/**/aws-sdk/**',
						'node_modules/sinon/**',
						'node_modules/serverless/**',
						'node_modules/@serverless/**',
						'node_modules/@babel/**',
						'node_modules/eslint-plugin-import/**',
						'node_modules/@sinonjs/**'
					]
				},
				custom: {
					serviceTitle: 'Testing',
					serviceName: 'Testing',
					serviceCode: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					humanReadableStage: {
						local: 'Local',
						beta: 'Beta',
						qa: 'QA',
						prod: 'Prod'
					},

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					cacheEnabled: {
						prod: false
					},

					customDomain: {
						domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceCode}'
					},

					serviceApiSecret: {
						local: '',
						beta: '',
						qa: '',
						prod: ''
					},

					reducer: {
						ignoreMissing: true
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-stage-variables',
					'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
					'serverless-plugin-split-stacks'
				],
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
									'application/json': '{"message":$context.error.messageString}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
								},
								ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
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
									'application/json': '{"message":"Timeout"}'
								},
								ResponseType: 'INTEGRATION_TIMEOUT',
								RestApiId: {
									Ref: 'ApiGatewayRestApi'
								},
								StatusCode: '504'
							}
						}
					}
				}
			});
		});

		it('Should set the API secrets if passed', () => {

			const serviceConfig = base({}, {
				serviceCode: 'testing',
				servicePort: validServicePort,
				apiSecrets: {
					local: 'test',
					beta: '4f06f114-a4e8-44dd-a9a3-6436323509b7',
					qa: '4f06f114-a4e8-44dd-a9a3-6436323509b8',
					prod: '4f06f114-a4e8-44dd-a9a3-6436323509b9'
				}
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
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
					versionFunctions: false
				},
				package: {
					individually: false,
					include: [
						'src/config/*'
					],
					exclude: [
						'.nyc_output/**',
						'view-schemas/**',
						'view-schemas-built/**',
						'tests/**',
						'hooks/**',
						'events/**',
						'permissions/**',
						'schemas/src/**',
						'serverless/**',
						'src/environments/**',
						'*',
						'.*',
						'node_modules/aws-sdk/**',
						'node_modules/**/aws-sdk/**',
						'node_modules/sinon/**',
						'node_modules/serverless/**',
						'node_modules/@serverless/**',
						'node_modules/@babel/**',
						'node_modules/eslint-plugin-import/**',
						'node_modules/@sinonjs/**'
					]
				},
				custom: {
					serviceTitle: 'Testing',
					serviceName: 'Testing',
					serviceCode: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					humanReadableStage: {
						local: 'Local',
						beta: 'Beta',
						qa: 'QA',
						prod: 'Prod'
					},

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					cacheEnabled: {
						prod: false
					},

					customDomain: {
						domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceCode}'
					},

					serviceApiSecret: {
						local: 'test',
						beta: '4f06f114-a4e8-44dd-a9a3-6436323509b7',
						qa: '4f06f114-a4e8-44dd-a9a3-6436323509b8',
						prod: '4f06f114-a4e8-44dd-a9a3-6436323509b9'
					},

					reducer: {
						ignoreMissing: true
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-stage-variables',
					'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
					'serverless-plugin-split-stacks'
				],
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
									'application/json': '{"message":$context.error.messageString}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
								},
								ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
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
									'application/json': '{"message":"Timeout"}'
								},
								ResponseType: 'INTEGRATION_TIMEOUT',
								RestApiId: {
									Ref: 'ApiGatewayRestApi'
								},
								StatusCode: '504'
							}
						}
					}
				}
			});
		});

		it('Should add the VPC Access managed policy if vpc is configured', () => {

			const serviceConfig = base({
				provider: {
					vpc: {
						securityGroupId: 'sg-123456',
						subnetIds: [
							'sub-123456',
							'sub-123457'
						]
					}
				}
			}, {
				serviceCode: 'testing',
				servicePort: validServicePort
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
					role: 'ServiceExecutionRole',
					vpc: {
						securityGroupId: 'sg-123456',
						subnetIds: [
							'sub-123456',
							'sub-123457'
						]
					},
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
					versionFunctions: false
				},
				package: {
					individually: false,
					include: [
						'src/config/*'
					],
					exclude: [
						'.nyc_output/**',
						'view-schemas/**',
						'view-schemas-built/**',
						'tests/**',
						'hooks/**',
						'events/**',
						'permissions/**',
						'schemas/src/**',
						'serverless/**',
						'src/environments/**',
						'*',
						'.*',
						'node_modules/aws-sdk/**',
						'node_modules/**/aws-sdk/**',
						'node_modules/sinon/**',
						'node_modules/serverless/**',
						'node_modules/@serverless/**',
						'node_modules/@babel/**',
						'node_modules/eslint-plugin-import/**',
						'node_modules/@sinonjs/**'
					]
				},
				custom: {
					serviceTitle: 'Testing',
					serviceName: 'Testing',
					serviceCode: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					humanReadableStage: {
						local: 'Local',
						beta: 'Beta',
						qa: 'QA',
						prod: 'Prod'
					},

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					cacheEnabled: {
						prod: false
					},

					customDomain: {
						domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceCode}'
					},

					serviceApiSecret: {
						local: '',
						beta: '',
						qa: '',
						prod: ''
					},

					reducer: {
						ignoreMissing: true
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-stage-variables',
					'@janiscommerce/serverless-plugin-remove-authorizer-permissions',
					'serverless-plugin-split-stacks'
				],
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
								ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'],
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
									'application/json': '{"message":$context.error.messageString}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
								},
								ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
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
									'application/json': '{"message":"Timeout"}'
								},
								ResponseType: 'INTEGRATION_TIMEOUT',
								RestApiId: {
									Ref: 'ApiGatewayRestApi'
								},
								StatusCode: '504'
							}
						}
					}
				}
			});
		});

		it('Should override the original configuration for xxxOnly configurations', () => {

			const serviceConfig = base({
				provider: {
					logRetentionInDays: 30
				},
				custom: {
					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,
				package: {
					includeOnly: [
						'custom/path/**'
					],
					excludeOnly: [
						'something'
					]
				},
				pluginsOnly: [
					'my-unique-plugin'
				]
			}, {
				serviceCode: 'testing',
				servicePort: validServicePort
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
					role: 'ServiceExecutionRole',
					endpointType: 'REGIONAL',
					apiName: 'JANIS ${self:custom.humanReadableStage.${self:custom.stage}} ${self:custom.serviceTitle} API',
					logRetentionInDays: 30,
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
					versionFunctions: false
				},
				package: {
					individually: false,
					include: [
						'custom/path/**'
					],
					exclude: [
						'something'
					]
				},
				custom: {
					serviceTitle: 'Testing',
					serviceName: 'Testing',
					serviceCode: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					humanReadableStage: {
						local: 'Local',
						beta: 'Beta',
						qa: 'QA',
						prod: 'Prod'
					},

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					cacheEnabled: {
						prod: false
					},

					customDomain: {
						domainName: '${self:custom.serviceCode}.${self:custom.janisDomains.${self:custom.stage}}',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceCode}'
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

					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,

				plugins: [
					'my-unique-plugin'
				],
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
									'application/json': '{"message":$context.error.messageString}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
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
									'application/json': '{"message":$context.error.messageString,"validationError":"$context.error.validationErrorString"}'
								},
								ResponseType: 'AUTHORIZER_CONFIGURATION_ERROR',
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
									'application/json': '{"message":"Timeout"}'
								},
								ResponseType: 'INTEGRATION_TIMEOUT',
								RestApiId: {
									Ref: 'ApiGatewayRestApi'
								},
								StatusCode: '504'
							}
						}
					}
				}
			});
		});
	});

});
