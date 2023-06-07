'use strict';

/* eslint-disable max-len */

const assert = require('assert').strict;
const sinon = require('sinon');

const { base } = require('../../..');

describe('Hooks', () => {

	describe('Base service', () => {

		const originalEnvs = { ...process.env };

		afterEach(() => {
			process.env = { ...originalEnvs };
			sinon.restore();
		});

		const validServicePort = 3000;
		const validServiceCode = 'testing';

		const expectedConfig = {
			service: 'Janis${self:custom.serviceName}Service',
			provider: {
				name: 'aws',
				runtime: 'nodejs18.x',
				memorySize: 1024,
				stage: '${opt:stage, \'local\'}',
				region: '${opt:region, \'us-east-1\'}',
				role: 'ServiceExecutionRole',
				endpointType: 'REGIONAL',
				apiName: 'JANIS ${param:humanReadableStage} ${self:custom.serviceTitle} API',
				logRetentionInDays: 14,
				environment: {
					JANIS_SERVICE_NAME: '${self:custom.serviceCode}',
					JANIS_ENV: '${self:custom.stage}',
					MS_PATH: 'src'
				},
				tags: {
					Owner: 'Janis',
					Microservice: '${self:custom.serviceName}',
					Stack: '${param:humanReadableStage}'
				},
				versionFunctions: false,
				apiGateway: {
					disableDefaultEndpoint: true,
					minimumCompressionSize: 1024
				},
				logs: {
					restApi: {
						accessLogging: true,
						executionLogging: false,
						level: 'INFO',
						fullExecutionData: false,
						format: JSON.stringify({
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
						})
					}
				}
			},
			params: {
				local: {
					humanReadableStage: 'Local',
					janisDomain: 'janis.localhost'
				},
				beta: {
					humanReadableStage: 'Beta',
					janisDomain: 'janisdev.in'
				},
				qa: {
					janisDomain: 'janisqa.in',
					humanReadableStage: 'QA'
				},
				prod: {
					humanReadableStage: 'Prod',
					janisDomain: 'janis.in'
				}
			},
			package: {
				individually: false,
				include: [
					'src/config/*',
					'node_modules/@babel/runtime/**'
				],
				exclude: [
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
					'node_modules/function.prototype.name/**',
					'node_modules/which-typed-array/**',
					'node_modules/is-typed-array/**',
					'mongodb/src/**',
					'bson/dist/**',
					'bson/src/**',
					'node_modules/@aws-sdk/**',
					'node_modules/**/@aws-sdk/**',
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
					'node_modules/**/axios/dist/browser/**',
					'node_modules/**/axios/dist/esm/**'
				]
			},
			custom: {
				serviceTitle: 'Testing',
				serviceName: 'Testing',
				serviceCode: 'testing',
				stage: '${self:provider.stage}',
				region: '${self:provider.region}',

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
					domainName: '${self:custom.serviceCode}.${param:janisDomain}',
					basePath: 'api',
					stage: '${self:custom.stage}',
					createRoute53Record: true,
					endpointType: 'regional',
					securityPolicy: 'tls_1_2'
				},

				apiGatewayCaching: {
					enabled: '${self:custom.cacheEnabled.${self:custom.stage}, \'false\'}',
					clusterSize: '0.5',
					ttlInSeconds: 600 // 10 minutos
				},

				'serverless-offline': {
					httpPort: 3000,
					lambdaPort: 23000,
					host: '0.0.0.0',
					stage: 'local',
					noPrependStageInUrl: true,
					prefix: 'api',
					reloadHandler: true
				},

				stageVariables: {
					serviceName: '${self:custom.serviceCode}'
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
								'application/json': '{"message":$context.error.messageString,"detail":"$context.authorizer.errorMessage","authorizerErrorType":"$context.error.responseType"}'
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
								'application/json': '{"message":$context.error.messageString,"detail":"$context.authorizer.errorMessage","authorizerErrorType":"$context.error.responseType"}'
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
								'application/json': '{"message":$context.error.messageString,"detail":"$context.authorizer.errorMessage","authorizerErrorType":"$context.error.responseType"}'
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
								'application/json': '{"message":$context.error.messageString,"detail":"$context.authorizer.errorMessage","authorizerErrorType":"$context.error.responseType"}'
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
								'application/json': '{"message":$context.error.messageString,"detail":"$context.authorizer.errorMessage","authorizerErrorType":"$context.error.responseType"}'
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
			}
		};

		context('When required config is missing', () => {

			it('Should throw if serviceCode hook config is not defined', () => {
				assert.throws(() => base({}, {
					servicePort: validServicePort
				}));
			});

			it('Should throw if servicePort hook config is not defined', () => {
				assert.throws(() => base({}, {
					serviceCode: validServiceCode
				}));
			});
		});

		context('When invalid config received', () => {

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

			it('Should throw if servicePort hook config is not a string', () => {
				assert.throws(() => base({}, {
					serviceCode: validServiceCode,
					servicePort: ['invalid']
				}));
			});
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
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			assert.deepStrictEqual(serviceConfig, expectedConfig);
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
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			const clonedExpectedConfig = JSON.parse(JSON.stringify(expectedConfig));

			clonedExpectedConfig.provider.logRetentionInDays = 30;
			clonedExpectedConfig.custom.myCustomProp = { foo: 'bar' };
			clonedExpectedConfig.anotherProp = true;
			clonedExpectedConfig.package.individually = false;
			clonedExpectedConfig.package.include.push('custom/path/**');
			clonedExpectedConfig.package.exclude.push('something');
			clonedExpectedConfig.plugins.push('some-custom-plugin');

			assert.deepStrictEqual(serviceConfig, clonedExpectedConfig);
		});

		it('Should use original configuration to override hook defaults', () => {

			const serviceConfig = base({
				provider: {
					memorySize: 512
				}
			}, {
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			const clonedExpectedConfig = JSON.parse(JSON.stringify(expectedConfig));

			clonedExpectedConfig.provider.memorySize = 512;

			assert.deepStrictEqual(serviceConfig, clonedExpectedConfig);
		});

		it('Should override the original configuration for xxxOnly configurations', () => {

			const serviceConfig = base({
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
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			const clonedExpectedConfig = JSON.parse(JSON.stringify(expectedConfig));

			clonedExpectedConfig.package.include = ['custom/path/**'];
			clonedExpectedConfig.package.exclude = ['something'];
			clonedExpectedConfig.plugins = ['my-unique-plugin'];

			assert.deepStrictEqual(serviceConfig, clonedExpectedConfig);
		});

		it('Should setup the Trace Layer if env vars are set', () => {

			process.env.TRACE_ACCOUNT_ID = '012345678910';
			process.env.JANIS_TRACE_EXTENSION_VERSION = '1';

			const serviceConfig = base({}, {
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			const clonedExpectedConfig = JSON.parse(JSON.stringify(expectedConfig));

			clonedExpectedConfig.provider.layers = ['arn:aws:lambda:${aws:region}:012345678910:layer:trace:1'];
			clonedExpectedConfig.provider.environment.JANIS_TRACE_EXTENSION_ENABLED = 'true';

			assert.deepStrictEqual(serviceConfig, clonedExpectedConfig);
		});

		it('Should add and override sls params if they are passed', () => {

			const serviceConfig = base({
				params: {
					default: {
						defaultParam: true
					},
					beta: {
						humanReadableStage: 'Super beta'
					},
					qa: {
						humanReadableStage: 'Pruebas',
						anotherParam: 'I am new'
					}
				}
			}, {
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			const clonedExpectedConfig = JSON.parse(JSON.stringify(expectedConfig));

			clonedExpectedConfig.params.default = { defaultParam: true };
			clonedExpectedConfig.params.beta.humanReadableStage = 'Super beta';
			clonedExpectedConfig.params.qa.humanReadableStage = 'Pruebas';
			clonedExpectedConfig.params.qa.anotherParam = 'I am new';

			assert.deepStrictEqual(serviceConfig, clonedExpectedConfig);
		});

		it('Should add the VPC Config when env vars LAMBDA_SECURITY_GROUP_ID and LAMBDA_SUBNET_IDS are set', () => {

			process.env.LAMBDA_SECURITY_GROUP_ID = 'sg-abcdef0001';
			process.env.LAMBDA_SUBNET_IDS = ' subnet-111111111, subnet-222222222,subnet-333333333';

			const serviceConfig = base({}, {
				serviceCode: validServiceCode,
				servicePort: validServicePort
			});

			const clonedExpectedConfig = JSON.parse(JSON.stringify(expectedConfig));

			clonedExpectedConfig.provider.vpc = {
				securityGroupIds: ['sg-abcdef0001'],
				subnetIds: ['subnet-111111111', 'subnet-222222222', 'subnet-333333333']
			};

			assert.deepStrictEqual(serviceConfig, clonedExpectedConfig);
		});
	});

});
