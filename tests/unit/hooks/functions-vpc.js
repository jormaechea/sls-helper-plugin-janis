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

	const hookParams = {
		vpcId: 'vpc-11111111',
		subnetIds: [
			'subnet-111111111',
			'subnet-222222222'
		]
	};

	const functionsInVPC = [
		{
			MyFunction: {
				name: 'MyFunction',
				handler: 'src/lambda/my-function.js',
				vpc: {
					securityGroupIds: { Ref: 'ServiceSecurityGroup' },
					subnetIds: hookParams.subnetIds
				}
			}
		},
		{
			MyOtherFunction: {
				name: 'MyOtherFunction',
				handler: 'src/lambda/my-other-function.js',
				vpc: {
					securityGroupIds: { Ref: 'ServiceSecurityGroup' },
					subnetIds: hookParams.subnetIds
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
			VpcId: hookParams.vpcId
		}
	};

	describe('Functions VPC', () => {

		it('Should not set the VPC up if vpcId is not set', () => {

			const serviceConfig = functionsVpc(serviceBase, {
				subnetIds: hookParams.subnetIds
			});

			assert.deepStrictEqual(serviceConfig, serviceBase);
		});

		it('Should not set the VPC up if subnetIds are not set', () => {

			const serviceConfig = functionsVpc(serviceBase, {
				vpcId: hookParams.vpcId
			});

			assert.deepStrictEqual(serviceConfig, serviceBase);
		});

		it('Should not set the VPC up if subnetIds are empty', () => {

			const serviceConfig = functionsVpc(serviceBase, {
				vpcId: hookParams.vpcId,
				subnetIds: []
			});

			assert.deepStrictEqual(serviceConfig, serviceBase);
		});

		it('Should set the VPC on each function and set-up the security group', () => {

			const serviceConfig = functionsVpc(serviceBase, hookParams);

			assert.deepStrictEqual(serviceConfig, {
				...serviceBase,
				functions: functionsInVPC,
				resources: {
					Resources: {
						[expectedSecurityGroupName]: expectedSecurityGroupConfig
					}
				}
			});
		});

		it('Should not override existing resources', () => {

			const serviceConfig = functionsVpc({
				...serviceBase,
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
			}, hookParams);

			assert.deepStrictEqual(serviceConfig, {
				...serviceBase,
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

			const { functions, ...serviceWithoutFunctions } = serviceBase;

			const serviceConfig = functionsVpc(serviceWithoutFunctions, hookParams);

			assert.deepStrictEqual(serviceConfig, {
				...serviceWithoutFunctions,
				resources: {
					Resources: {
						[expectedSecurityGroupName]: expectedSecurityGroupConfig
					}
				}
			});
		});

	});
});
