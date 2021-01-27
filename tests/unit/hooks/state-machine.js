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
				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							'SM-MachineName': hooksParams
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: 'SM-${self:custom.serviceName}-machineName-${self:custom.stage}',
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
				const serviceConfig = stateMachine({}, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							'SM-MachineName': hooksParams
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: 'SM-${self:custom.serviceName}-machineName-${self:custom.stage}',
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
				const serviceConfig = stateMachine(serviceBase, hooksParams);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							[`SM-${pascalCase(hooksParams.name)}`]: hooksParams
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: 'SM-${self:custom.serviceName}-machineName-${self:custom.stage}',
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
				const serviceConfig = stateMachine({
					...serviceBase,
					plugins: [
						'somePreviousPlugin',
						'otherPlugin'
					],
					stepFunctions: {
						stateMachines: {
							'SM-PreviousMachineName': {
								name: 'previousMachineName',
								definition: { foo: 'bar' }
							}
						}
					},
					custom: {
						someCustomStuff: 'foo',
						machines: {
							PreviousMachine: {
								name: 'SM-${self:custom.serviceName}-previousMachine-${self:custom.stage}',
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
							'SM-PreviousMachineName': {
								name: 'previousMachineName',
								definition: { foo: 'bar' }
							},
							[`SM-${pascalCase(hooksParams.name)}`]: hooksParams
						}
					},
					custom: {
						someCustomStuff: 'foo',
						machines: {
							PreviousMachine: {
								name: 'SM-${self:custom.serviceName}-previousMachine-${self:custom.stage}',
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
								name: `SM-\${self:custom.serviceName}-${camelCase(hooksParams.name)}-\${self:custom.stage}`,
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
				const serviceConfig = stateMachine(stateMachine({}, hooksParams1), hooksParams2);

				assert.deepStrictEqual(serviceConfig, {
					plugins: [
						'serverless-step-functions'
					],
					stepFunctions: {
						stateMachines: {
							'SM-MachineName': hooksParams1,
							'SM-OtherMachineName': hooksParams2
						}
					},
					custom: {
						machines: {
							MachineName: {
								name: 'SM-${self:custom.serviceName}-machineName-${self:custom.stage}',
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
								name: 'SM-${self:custom.serviceName}-otherMachineName-${self:custom.stage}',
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
