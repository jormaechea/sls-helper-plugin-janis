'use strict';

const assert = require('assert').strict;

const { base } = require('../../..');

describe('Hooks', () => {

	describe('Base service', () => {

		it('Should throw if serviceName hook config is not defined', () => {
			assert.throws(() => base({}, {
				servicePort: 3000
			}));
		});

		it('Should throw if serviceName hook config is not a string', () => {
			assert.throws(() => base({}, {
				serviceName: ['invalid'],
				servicePort: 3000
			}));
		});

		it('Should throw if servicePort hook config is not defined', () => {
			assert.throws(() => base({}, {
				serviceName: 'Testing'
			}));
		});

		it('Should throw if servicePort hook config is not a string', () => {
			assert.throws(() => base({}, {
				serviceName: 'Testing',
				servicePort: ['invalid']
			}));
		});

		it('Should return the base service configuration', () => {

			const serviceConfig = base({}, {
				serviceName: 'Testing',
				servicePort: 3000
			});

			assert.deepStrictEqual(serviceConfig, {
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
					]
				},
				package: {
					individually: true,
					include: [
						'src/config/*'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
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

					prune: {
						automatic: true,
						number: 3
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-reqvalidator-plugin',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-reducer',
					'serverless-plugin-split-stacks',
					'serverless-plugin-prune',
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
				]
			});
		});

		it('Should not override the original configuration', () => {

			const serviceConfig = base({
				custom: {
					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,
				package: {
					individually: true,
					include: [
						'custom/path/**'
					],
					exclude: [
						'something'
					]
				}
			}, {
				serviceName: 'Testing',
				servicePort: 3000
			});

			assert.deepStrictEqual(serviceConfig, {
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
					]
				},
				package: {
					individually: true,
					include: [
						'src/config/*',
						'custom/path/**'
					],
					exclude: [
						'something'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
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

					prune: {
						automatic: true,
						number: 3
					},

					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,

				plugins: [
					'serverless-domain-manager',
					'serverless-reqvalidator-plugin',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-reducer',
					'serverless-plugin-split-stacks',
					'serverless-plugin-prune',
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
				]
			});
		});

		it('Should use original configuration to override hook defaults', () => {

			const serviceConfig = base({
				provider: {
					memorySize: 512
				}
			}, {
				serviceName: 'Testing',
				servicePort: 3000
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'Janis${self:custom.serviceName}Service',
				provider: {
					name: 'aws',
					runtime: 'nodejs12.x',
					memorySize: 512,
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
					]
				},
				package: {
					individually: true,
					include: [
						'src/config/*'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
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

					prune: {
						automatic: true,
						number: 3
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-reqvalidator-plugin',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-reducer',
					'serverless-plugin-split-stacks',
					'serverless-plugin-prune',
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
				]
			});
		});

		it('Should set the API secrets if passed', () => {

			const serviceConfig = base({}, {
				serviceName: 'Testing',
				servicePort: 3000,
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
					]
				},
				package: {
					individually: true,
					include: [
						'src/config/*'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
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
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true,
						cacheInvalidationRegex: 'node_modules/(?!\\@janiscommerce\\/[^(mongodb)])'
					},

					stageVariables: {
						serviceName: '${self:custom.serviceNameInLowerCase}'
					},

					serviceApiSecret: {
						local: 'test',
						beta: '4f06f114-a4e8-44dd-a9a3-6436323509b7',
						qa: '4f06f114-a4e8-44dd-a9a3-6436323509b8',
						prod: '4f06f114-a4e8-44dd-a9a3-6436323509b9'
					},

					reducer: {
						ignoreMissing: true
					},

					prune: {
						automatic: true,
						number: 3
					}
				},
				plugins: [
					'serverless-domain-manager',
					'serverless-reqvalidator-plugin',
					'serverless-offline',
					'serverless-api-gateway-caching',
					'serverless-plugin-reducer',
					'serverless-plugin-split-stacks',
					'serverless-plugin-prune',
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
				]
			});
		});
	});

});
