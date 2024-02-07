'use strict';

const { defaultTags } = require('../utils/default-tags');

/**
 * IMPORTANT
 *
 * This hook attaches the VPC to each function instead of making it at the `provider` level to avoid a bug with the `serverless-plugin-split-stacks` plugin
 * where the Security Group ID is passed as a CloudFormation parameter to substacks, but it's only passed to the first one, breaking any other substacks
 */

const addSecurityGroup = (currentResources, vpcId) => {

	const name = 'ServiceSecurityGroup';

	const resource = {
		Type: 'AWS::EC2::SecurityGroup',
		Properties: {
			GroupName: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}',
			GroupDescription: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}',
			Tags: [
				{ Key: 'Name', Value: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}' },
				...defaultTags
			],
			VpcId: vpcId
		}
	};

	return Array.isArray(currentResources)
		? [...currentResources, { [name]: resource }]
		: { ...currentResources, [name]: resource };
};

module.exports = (serviceConfig, hookParams) => {

	if(!hookParams?.vpcId || !hookParams?.subnetIds?.length)
		return serviceConfig;

	// Set VPC config for each function
	if(serviceConfig.functions?.length) {
		serviceConfig.functions.forEach(functionObject => {
			Object.values(functionObject).forEach(fn => {
				fn.vpc = {
					securityGroupIds: [{ Ref: 'ServiceSecurityGroup' }],
					subnetIds: hookParams.subnetIds
				};
			});
		});
	}

	const newResources = addSecurityGroup(serviceConfig.resources?.Resources || {}, hookParams.vpcId);

	return {
		...serviceConfig,
		resources: {
			...serviceConfig.resources,
			Resources: newResources
		}
	};
};
