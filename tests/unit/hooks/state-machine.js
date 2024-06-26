'use strict';

const assert = require('assert').strict;

const { stateMachine } = require('../../..');
const { camelCase, upperCamelCase } = require('../../../lib/utils/string');

describe('Hooks', () => {

	const serviceBase = {
		custom: {},
		plugins: [],
		stepFunctions: {}
	};

	const definition = {
		Comment: 'Create Session Machine',
		StartAt: 'WaitForCall',
		States: {
			WaitForCall: {
				Type: 'Wait',
				SecondsPath: '$.body.wait',
				Next: 'TrackingCall'
			}
		}
	};

	describe('State Machine', () => {

		context('Config validation', () => {

			it('Should throw if name param is missing', () => {

				assert.throws(() => stateMachine(serviceBase, {
					definition
				}), {
					message: /name/
				});
			});

			it('Should throw if definition param is missing', () => {

				assert.throws(() => stateMachine(serviceBase, {
					name: 'my service'
				}), {
					message: /definition/
				});
			});

			it('Should throw if type param is invalid', () => {

				assert.throws(() => stateMachine(serviceBase, {
					name: 'my service',
					definition,
					type: 'UNKNOWN'
				}), {
					message: /UNKNOWN/
				});
			});
		});

		context('State Machine generation', () => {

			it('Should return the service config with the plugin, stepFunctions and the machines when passing the required params', () => {

				const hooksParams = {
					name: 'MachineName',
					definition
				};

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams,
								name: machineName
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should be able to handle express workflows, logging configuration and raw properties', () => {

				const hooksParams = {
					name: 'MachineName',
					type: 'EXPRESS',
					loggingConfig: {
						level: 'ERROR',
						includeExecutionData: true,
						destinations: [{
							'Fn::GetAtt': ['MyLogGroup', 'Arn']
						}]
					},
					definition,
					rawProperties: {
						tracingConfig: {
							enabled: true
						}
					}
				};

				const { rawProperties, ...bypassParams } = hooksParams;

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams.rawProperties,
								...bypassParams,
								name: machineName
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should set default logging config and create default log group if loggingConfig is true', () => {

				const hooksParams = {
					name: 'MachineName',
					type: 'EXPRESS',
					loggingConfig: true,
					definition,
					rawProperties: {
						tracingConfig: {
							enabled: true
						}
					}
				};

				const { rawProperties, loggingConfig, ...bypassParams } = hooksParams;

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams.rawProperties,
								...bypassParams,
								name: machineName,
								loggingConfig: {
									level: 'INFO',
									includeExecutionData: true,
									destinations: [
										{
											'Fn::GetAtt': ['MachineNameLogGroup', 'Arn']
										}
									]
								}
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					},
					resources: {
						Resources: {
							MachineNameLogGroup: {
								Type: 'AWS::Logs::LogGroup',
								Properties: {
									LogGroupName: '/janis/state-machine/${self:custom.serviceName}-MachineName-${self:custom.stage}',
									RetentionInDays: 60,
									Tags: [
										{
											Key: 'Owner',
											Value: 'Janis'
										},
										{
											Key: 'Microservice',
											Value: '${self:custom.serviceName}'
										},
										{
											Key: 'Stack',
											Value: '${param:humanReadableStage}'
										}
									]
								}
							}
						}
					}
				});
			});

			it('Should set default logging config with custom log level and create default log group if loggingConfig is a string', () => {

				const hooksParams = {
					name: 'MachineName',
					type: 'EXPRESS',
					loggingConfig: 'ERROR',
					definition,
					rawProperties: {
						tracingConfig: {
							enabled: true
						}
					}
				};

				const { rawProperties, loggingConfig, ...bypassParams } = hooksParams;

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams.rawProperties,
								...bypassParams,
								name: machineName,
								loggingConfig: {
									level: 'ERROR',
									includeExecutionData: true,
									destinations: [
										{
											'Fn::GetAtt': ['MachineNameLogGroup', 'Arn']
										}
									]
								}
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					},
					resources: {
						Resources: {
							MachineNameLogGroup: {
								Type: 'AWS::Logs::LogGroup',
								Properties: {
									LogGroupName: '/janis/state-machine/${self:custom.serviceName}-MachineName-${self:custom.stage}',
									RetentionInDays: 60,
									Tags: [
										{
											Key: 'Owner',
											Value: 'Janis'
										},
										{
											Key: 'Microservice',
											Value: '${self:custom.serviceName}'
										},
										{
											Key: 'Stack',
											Value: '${param:humanReadableStage}'
										}
									]
								}
							}
						}
					}
				});
			});

			it('Should not create a log group if destinations array is provided', () => {

				const hooksParams = {
					name: 'MachineName',
					type: 'EXPRESS',
					loggingConfig: {
						level: 'ERROR',
						includeExecutionData: false,
						destinations: [{
							'Fn::GetAtt': ['MyLogGroup', 'Arn']
						}]
					},
					definition,
					rawProperties: {
						tracingConfig: {
							enabled: true
						}
					}
				};

				const { rawProperties, loggingConfig, ...bypassParams } = hooksParams;

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams.rawProperties,
								...bypassParams,
								name: machineName,
								loggingConfig: {
									level: 'ERROR',
									includeExecutionData: false,
									destinations: [
										{
											'Fn::GetAtt': ['MyLogGroup', 'Arn']
										}
									]
								}
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should not create a log group if loggingConfig is not set', () => {

				const hooksParams = {
					name: 'MachineName',
					type: 'EXPRESS',
					definition,
					rawProperties: {
						tracingConfig: {
							enabled: true
						}
					}
				};

				const { rawProperties, loggingConfig, ...bypassParams } = hooksParams;

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams.rawProperties,
								...bypassParams,
								name: machineName
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should not create a log group if loggingConfig is not set (with previous resources set)', () => {

				const hooksParams = {
					name: 'MachineName',
					type: 'EXPRESS',
					definition,
					rawProperties: {
						tracingConfig: {
							enabled: true
						}
					}
				};

				const { rawProperties, loggingConfig, ...bypassParams } = hooksParams;

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({
					resources: {
						Resources: {
							SomeResource: {
								foo: 'bar'
							}
						}
					}
				}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams.rawProperties,
								...bypassParams,
								name: machineName
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					},
					resources: {
						Resources: {
							SomeResource: {
								foo: 'bar'
							}
						}
					}
				});
			});

			it('Should return the service config and the state machine with name in camelCase', () => {

				const hooksParams = {
					name: 'Machine Name',
					definition
				};

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams,
								name: machineName
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should return the service config with plugins, stepFunctions and the machines when passing the required params', () => {

				const hooksParams = {
					name: 'MachineName',
					definition
				};

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine(serviceBase, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							[upperCamelCase(hooksParams.name)]: {
								...hooksParams,
								name: machineName
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should return the service config with previous plugins, stepFunctions and machines when passing the required params', () => {

				const hooksParams = {
					name: 'MachineName',
					definition
				};

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({
					...serviceBase,
					plugins: [
						'somePreviousPlugin',
						'otherPlugin'
					],
					stepFunctions: {
						stateMachines: {
							PreviousMachineName: {
								name: 'previousMachineName',
								definition: { foo: 'bar' }
							}
						}
					},
					custom: {
						someCustomStuff: 'foo',
						machines: {
							PreviousMachine: {
								name: '${self:custom.serviceName}-previousMachine-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.previousMachine.name}'
										]
									]
								}
							}
						}
					}
				}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'somePreviousPlugin',
						'otherPlugin',
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							PreviousMachineName: {
								name: 'previousMachineName',
								definition: { foo: 'bar' }
							},
							[upperCamelCase(hooksParams.name)]: {
								...hooksParams,
								name: machineName
							}
						}
					},
					custom: {
						someCustomStuff: 'foo',
						machines: {
							PreviousMachine: {
								name: '${self:custom.serviceName}-previousMachine-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.previousMachine.name}'
										]
									]
								}
							},
							MachineName: {
								name: `\${self:custom.serviceName}-${camelCase(hooksParams.name)}-\${self:custom.stage}`,
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});

			it('Should not repeat the step-functions plugin on consecutive calls', () => {

				const hooksParams1 = {
					name: 'MachineName',
					definition
				};
				const hooksParams2 = {
					name: 'OtherMachineName',
					definition
				};

				const machineName1 = '${self:custom.serviceName}-machineName-${self:custom.stage}';
				const machineName2 = '${self:custom.serviceName}-otherMachineName-${self:custom.stage}';

				const serviceConfig = stateMachine(stateMachine({}, hooksParams1), hooksParams2);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hooksParams1,
								name: machineName1
							},
							OtherMachineName: {
								...hooksParams2,
								name: machineName2
							}
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.MachineName.name}'
										]
									]
								}
							},
							OtherMachineName: {
								name: '${self:custom.serviceName}-otherMachineName-${self:custom.stage}',
								arn: {
									'Fn::Join': [
										':',
										[
											'arn:aws:states',
											'${self:custom.region}',
											{ Ref: 'AWS::AccountId' },
											'stateMachine',
											'${self:custom.machines.OtherMachineName.name}'
										]
									]
								}
							}
						}
					}
				});
			});
		});

		context('State Machine generation with fixed parameters in tasks', () => {

			context('When the task is in the root of the state machine', () => {

				const definitionWithTask = (parameters, resource) => ({
					Comment: 'Create Session Machine',
					StartAt: 'ProcessCall',
					States: {
						ProcessCall: {
							Type: 'Task',
							...resource && { Resource: resource },
							...parameters && { Parameters: parameters },
							Next: 'TrackingCall'
						}
					}
				});

				it('Should return the service config with the complete parameters when does not exist in the task', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: definitionWithTask()
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: definitionWithTask({
							'session.$': '$.session',
							'body.$': '$.body',
							'stateMachine.$': '$$.StateMachine',
							'state.$': '$$.State'
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the complete parameters without new param (stateMachine) when a step execute an State Machine', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: definitionWithTask(undefined, 'arn:aws:states:::states:startExecution')
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: definitionWithTask(undefined, 'arn:aws:states:::states:startExecution')
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the new param (stateMachine) when the parameters exist in the task', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: definitionWithTask({
							'session.$': '$.session',
							'body.$': '$.body'
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: definitionWithTask({
							'session.$': '$.session',
							'body.$': '$.body',
							'stateMachine.$': '$$.StateMachine',
							'state.$': '$$.State'
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the new param (stateMachine) when the parameters has a "Payload" in the task', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: definitionWithTask({
							Payload: {
								'session.$': '$.session',
								'body.$': '$.body'
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: definitionWithTask({
							Payload: {
								'session.$': '$.session',
								'body.$': '$.body',
								'stateMachine.$': '$$.StateMachine',
								'state.$': '$$.State'
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the new param (stateMachine) when the parameters has a "Input" in the task', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: definitionWithTask({
							Input: {
								'session.$': '$.session',
								'body.$': '$.body'
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: definitionWithTask({
							Input: {
								'session.$': '$.session',
								'body.$': '$.body',
								'stateMachine.$': '$$.StateMachine',
								'state.$': '$$.State'
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the new param (stateMachine) when the parameters has a "Target.Input" in the task', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: definitionWithTask({
							Target: {
								Input: {
									'session.$': '$.session',
									'body.$': '$.body'
								}
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: definitionWithTask({
							Target: {
								Input: {
									'session.$': '$.session',
									'body.$': '$.body',
									'stateMachine.$': '$$.StateMachine',
									'state.$': '$$.State'
								}
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});
			});

			context('When tasks are in other states', () => {

				const generateDefinitionByState = state => ({
					Comment: 'Create Session Machine',
					StartAt: 'ProcessCall',
					States: {
						...state
					}
				});

				it('Should return the service config with the complete parameters when the task is in a Map type state', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Map',
								ItemProcessor: {
									ProcessorConfig: {
										Mode: 'DISTRIBUTED',
										ExecutionType: 'EXPRESS'
									},
									StartAt: 'TrackingCall',
									States: {
										TrackingCall: {
											Type: 'Task',
											End: true
										}
									}
								},
								Next: 'TrackingCall'
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Map',
								ItemProcessor: {
									ProcessorConfig: {
										Mode: 'DISTRIBUTED',
										ExecutionType: 'EXPRESS'
									},
									StartAt: 'TrackingCall',
									States: {
										TrackingCall: {
											Type: 'Task',
											Parameters: {
												'session.$': '$.session',
												'body.$': '$.body',
												'stateMachine.$': '$$.StateMachine',
												'state.$': '$$.State'
											},
											End: true
										}
									}
								},
								Next: 'TrackingCall'
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the complete parameters when the task is in a Map type state with the deprecated property', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Map',
								Iterator: {
									ProcessorConfig: {
										Mode: 'DISTRIBUTED',
										ExecutionType: 'EXPRESS'
									},
									StartAt: 'TrackingCall',
									States: {
										TrackingCall: {
											Type: 'Task',
											End: true
										}
									}
								},
								Next: 'TrackingCall'
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Map',
								Iterator: {
									ProcessorConfig: {
										Mode: 'DISTRIBUTED',
										ExecutionType: 'EXPRESS'
									},
									StartAt: 'TrackingCall',
									States: {
										TrackingCall: {
											Type: 'Task',
											Parameters: {
												'session.$': '$.session',
												'body.$': '$.body',
												'stateMachine.$': '$$.StateMachine',
												'state.$': '$$.State'
											},
											End: true
										}
									}
								},
								Next: 'TrackingCall'
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the complete parameters when the task is in a Map type state with the invalid property', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Map',
								OtherProperty: {
									ProcessorConfig: {
										Mode: 'DISTRIBUTED',
										ExecutionType: 'EXPRESS'
									},
									StartAt: 'TrackingCall',
									States: {
										TrackingCall: {
											Type: 'Task',
											End: true
										}
									}
								},
								Next: 'TrackingCall'
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Map',
								OtherProperty: {
									ProcessorConfig: {
										Mode: 'DISTRIBUTED',
										ExecutionType: 'EXPRESS'
									},
									StartAt: 'TrackingCall',
									States: {
										TrackingCall: {
											Type: 'Task',
											End: true
										}
									}
								},
								Next: 'TrackingCall'
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the complete parameters when the task is in a Parallel type state', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Parallel',
								Branches: [
									{
										StartAt: 'EndCall',
										States: {
											EndCall: {
												Type: 'Task',
												End: true
											}
										}
									},
									{
										StartAt: 'NotifyCall',
										States: {
											NotifyCall: {
												Type: 'Task',
												End: true
											}
										}
									}
								]
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Parallel',
								Branches: [
									{
										StartAt: 'EndCall',
										States: {
											EndCall: {
												Type: 'Task',
												Parameters: {
													'session.$': '$.session',
													'body.$': '$.body',
													'stateMachine.$': '$$.StateMachine',
													'state.$': '$$.State'
												},
												End: true
											}
										}
									},
									{
										StartAt: 'NotifyCall',
										States: {
											NotifyCall: {
												Type: 'Task',
												Parameters: {
													'session.$': '$.session',
													'body.$': '$.body',
													'stateMachine.$': '$$.StateMachine',
													'state.$': '$$.State'
												},
												End: true
											}
										}
									}
								]
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service configuration omitting the parameters when the task receives data from Parallel', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Parallel',
								Branches: [
									{
										StartAt: 'StartCall',
										States: {
											StartCall: {
												Type: 'Task',
												End: true
											}
										}
									}
								],
								Next: 'EndCall'
							},
							EndCall: {
								Type: 'Task',
								End: true
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Parallel',
								Branches: [
									{
										StartAt: 'StartCall',
										States: {
											StartCall: {
												Type: 'Task',
												Parameters: {
													'session.$': '$.session',
													'body.$': '$.body',
													'stateMachine.$': '$$.StateMachine',
													'state.$': '$$.State'
												},
												End: true
											}
										}
									}
								],
								Next: 'EndCall'
							},
							EndCall: {
								Type: 'Task',
								End: true
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});

				it('Should return the service config with the complete parameters when tasks exist at different levels.', () => {

					const hooksParams = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Task',
								Next: 'TrackingCall'
							},
							TrackingCall: {
								Type: 'Parallel',
								Branches: [
									{
										StartAt: 'EndCall',
										States: {
											EndCall: {
												Type: 'Map',
												ItemProcessor: {
													ProcessorConfig: {
														Mode: 'DISTRIBUTED',
														ExecutionType: 'EXPRESS'
													},
													StartAt: 'SendMessage',
													States: {
														SendMessage: {
															Type: 'Task',
															Parameters: {
																'session.$': '$.session',
																'body.$': '$.body'
															},
															End: true
														}
													}
												},
												End: true
											}
										}
									},
									{
										StartAt: 'NotifyCall',
										States: {
											NotifyCall: {
												Type: 'Task',
												Parameters: {
													Payload: {
														'session.$': '$.session',
														'body.$': '$.body'
													}
												},
												End: true
											}
										}
									}
								]
							}
						})
					};

					const hooksParamsResult = {
						name: 'MachineName',
						definition: generateDefinitionByState({
							ProcessCall: {
								Type: 'Task',
								Parameters: {
									'session.$': '$.session',
									'body.$': '$.body',
									'stateMachine.$': '$$.StateMachine',
									'state.$': '$$.State'

								},
								Next: 'TrackingCall'
							},
							TrackingCall: {
								Type: 'Parallel',
								Branches: [
									{
										StartAt: 'EndCall',
										States: {
											EndCall: {
												Type: 'Map',
												ItemProcessor: {
													ProcessorConfig: {
														Mode: 'DISTRIBUTED',
														ExecutionType: 'EXPRESS'
													},
													StartAt: 'SendMessage',
													States: {
														SendMessage: {
															Type: 'Task',
															Parameters: {
																'session.$': '$.session',
																'body.$': '$.body',
																'stateMachine.$': '$$.StateMachine',
																'state.$': '$$.State'
															},
															End: true
														}
													}
												},
												End: true
											}
										}
									},
									{
										StartAt: 'NotifyCall',
										States: {
											NotifyCall: {
												Type: 'Task',
												Parameters: {
													Payload: {
														'session.$': '$.session',
														'body.$': '$.body',
														'stateMachine.$': '$$.StateMachine',
														'state.$': '$$.State'
													}
												},
												End: true
											}
										}
									}
								]
							}
						})
					};

					const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

					const serviceConfig = stateMachine({}, hooksParams);

					assert.deepStrictEqual(serviceConfig, {
						plugins: [
							'serverless-step-functions'
						],
						stepFunctions: {
							stateMachines: {
								MachineName: {
									...hooksParamsResult,
									name: machineName
								}
							}
						},
						custom: {
							machines: {
								MachineName: {
									name: '${self:custom.serviceName}-machineName-${self:custom.stage}',
									arn: {
										'Fn::Join': [
											':',
											[
												'arn:aws:states',
												'${self:custom.region}',
												{ Ref: 'AWS::AccountId' },
												'stateMachine',
												'${self:custom.machines.MachineName.name}'
											]
										]
									}
								}
							}
						}
					});
				});
			});
		});
	});
});
