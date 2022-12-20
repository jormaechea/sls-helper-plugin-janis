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

	const stateTrackingCall = {
		Type: 'Task',
		Resources: 'arn:aws:states:::lambda',
		Next: 'EndCall'
	};

	const hookWithTaskGenerator = parameters => {

		return {
			name: 'MachineName',
			definition: {
				...definition,
				States: {
					...definition.States,
					TrackingCall: {
						...stateTrackingCall,
						...parameters && { Parameters: parameters }
					}
				}
			}
		};
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

				const hooksParams = hookWithTaskGenerator();

				const hookParamsParsed = hookWithTaskGenerator({
					'session.$': '$.session',
					'body.$': '$.body',
					'stateMachine.$': '$$.StateMachine'
				});

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hookParamsParsed,
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

				const hooksParams = hookWithTaskGenerator({
					Payload: {
						'session.$': '$.session',
						'body.$': '$.body'
					}
				});

				const hookParamsParsed = hookWithTaskGenerator({
					Payload: {
						'session.$': '$.session',
						'body.$': '$.body',
						'stateMachine.$': '$$.StateMachine'
					}
				});

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							MachineName: {
								...hookParamsParsed,
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

				const hooksParams = hookWithTaskGenerator({
					'session.$': '$.session',
					'body.$': '$.body'
				});

				const hookParamsParsed = hookWithTaskGenerator({
					'session.$': '$.session',
					'body.$': '$.body',
					'stateMachine.$': '$$.StateMachine'
				});

				const machineName = '${self:custom.serviceName}-machineName-${self:custom.stage}';

				const serviceConfig = stateMachine(serviceBase, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							[pascalCase(hooksParams.name)]: {
								...hookParamsParsed,
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
	});
});
