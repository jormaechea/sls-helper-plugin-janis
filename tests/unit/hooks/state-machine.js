'use strict';

const assert = require('assert').strict;
const camelCase = require('lodash.camelcase');
const startCase = require('lodash.startcase');

const { stateMachine } = require('../../..');

const pascalCase = name => startCase(camelCase(name)).replace(/ /g, '');

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
							[pascalCase(hooksParams.name)]: {
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
							[pascalCase(hooksParams.name)]: {
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

				const definitionWithTask = parameters => ({
					Comment: 'Create Session Machine',
					StartAt: 'ProcessCall',
					States: {
						ProcessCall: {
							Type: 'Task',
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
							'stateMachine.$': '$$.StateMachine'
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

				it('Should return the service config with the the new param (stateMachine) when the parameters exist in the task', () => {

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
							'stateMachine.$': '$$.StateMachine'
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

				it('Should return the service config with the the new param (stateMachine) when the parameters has a "Payload" in the task', () => {

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
								'stateMachine.$': '$$.StateMachine'
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
												'stateMachine.$': '$$.StateMachine'
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
												'stateMachine.$': '$$.StateMachine'
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
													'stateMachine.$': '$$.StateMachine'
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
													'stateMachine.$': '$$.StateMachine'
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
									'stateMachine.$': '$$.StateMachine'
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
																'stateMachine.$': '$$.StateMachine'
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
														'stateMachine.$': '$$.StateMachine'
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
