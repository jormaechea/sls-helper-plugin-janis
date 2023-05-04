'use strict';

const assert = require('assert').strict;

const { functionsVpc } = require('../../..');

describe('Hooks', () => {

	const serviceBase = {
		functions: [
			{
				MyFunction: {
					name: 'MyFunction',
					handler: 'src/lambda/my-function.js'
				}
			},
			{
				MyOtherFunction: {
					name: 'MyOtherFunction',
					handler: 'src/lambda/my-other-function.js'
				}
			}
		]
	};

	const functionsInVPC = [
		{
			MyFunction: {
				name: 'MyFunction',
				handler: 'src/lambda/my-function.js',
				vpc: {
					securityGroupIds: { Ref: 'ServiceSecurityGroup' },
					subnetIds: '${param:subnetIds}'
				}
			}
		},
		{
			MyOtherFunction: {
				name: 'MyOtherFunction',
				handler: 'src/lambda/my-other-function.js',
				vpc: {
					securityGroupIds: { Ref: 'ServiceSecurityGroup' },
					subnetIds: '${param:subnetIds}'
				}
			}
		}
	];

	const expectedSecurityGroupName = 'ServiceSecurityGroup';

	const expectedSecurityGroupConfig = {
		Type: 'AWS::EC2::SecurityGroup',
		Properties: {
			GroupName: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}',
			GroupDescription: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}',
			Tags: [
				{
					Key: 'Name',
					Value: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}'
				},
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
			],
			VpcId: '${param:vpcId}'
		}
	};

	const hookVariables = {
		local: {
			vpcId: 'vpc-11111111',
			subnetIds: [
				'subnet-111111111',
				'subnet-222222222'
			]
		},
		beta: {
			vpcId: 'vpc-1234567890abcdef0',
			subnetIds: [
				'subnet-1234567890abcdef0',
				'subnet-1234567890abcdef1',
				'subnet-1234567890abcdef2',
				'subnet-1234567890abcdef3'
			]
		},
		qa: {
			vpcId: 'vpc-2234567890abcdef0',
			subnetIds: [
				'subnet-2234567890abcdef0',
				'subnet-2234567890abcdef1',
				'subnet-2234567890abcdef2',
				'subnet-2234567890abcdef3'
			]
		},
		prod: {
			vpcId: 'vpc-3234567890abcdef0',
			subnetIds: [
				'subnet-3234567890abcdef0',
				'subnet-3234567890abcdef1',
				'subnet-3234567890abcdef2',
				'subnet-3234567890abcdef3'
			]
		}
	};

	describe('Functions VPC', () => {

		it('Should set the VPC on each function and set-up the security group', () => {

			const hooksParams = {
				variables: hookVariables
			};

			const serviceConfig = functionsVpc(serviceBase, hooksParams);

			assert.deepStrictEqual(serviceConfig, {
				...serviceBase,
				params: hookVariables,
				functions: functionsInVPC,
				resources: {
					Resources: {
						[expectedSecurityGroupName]: expectedSecurityGroupConfig
					}
				}
			});
		});

		it('Should not override existing serverless parameters or resources', () => {

			const hooksParams = {
				variables: hookVariables
			};

			const serviceConfig = functionsVpc({
				...serviceBase,
				params: {
					default: {
						test: 'foo'
					},
					local: {
						test: 'bar'
					}
				},
				resources: {
					Resources: [
						{
							MyBucket: {
								Type: 'AWS::S3::Bucket',
								Properties: {}
							}
						}
					],
					extensions: {
						SomeResource: {
							Properties: {
								SomeProperty: 10
							}
						}
					}
				}
			}, hooksParams);

			assert.deepStrictEqual(serviceConfig, {
				...serviceBase,
				params: {
					...hookVariables,
					default: {
						test: 'foo'
					},
					local: {
						test: 'bar',
						...hookVariables.local
					}
				},
				functions: functionsInVPC,
				resources: {
					Resources: [
						{
							MyBucket: {
								Type: 'AWS::S3::Bucket',
								Properties: {}
							}
						},
						{
							[expectedSecurityGroupName]: expectedSecurityGroupConfig
						}
					],
					extensions: {
						SomeResource: {
							Properties: {
								SomeProperty: 10
							}
						}
					}
				}
			});
		});

		it('Should not fail if no functions were declared', () => {

			const hooksParams = {
				variables: hookVariables
			};

			const { functions, ...serviceWithoutFunctions } = serviceBase;

			const serviceConfig = functionsVpc(serviceWithoutFunctions, hooksParams);

			assert.deepStrictEqual(serviceConfig, {
				...serviceWithoutFunctions,
				params: hookVariables,
				resources: {
					Resources: {
						[expectedSecurityGroupName]: expectedSecurityGroupConfig
					}
				}
			});
		});

	});
});
