'use strict';

/**
 * IMPORTANT
 *
 * This hook attaches the VPC to each function instead of making it at the `provider` level to avoid a bug with the `serverless-plugin-split-stacks` plugin
 * where the Security Group ID is passed as a CloudFormation parameter to substacks, but it's only passed to the first one, breaking any other substacks
 */

const setSlsParams = (slsParams, hookParams) => {

	const newParams = slsParams || {};

	Object.entries(hookParams).forEach(([stage, stageParams]) => {
		newParams[stage] = {
			...newParams[stage],
			...stageParams
		};
	});

	return newParams;
};

const addSecurityGroup = currentResources => {

	const name = 'ServiceSecurityGroup';

	const resource = {
		Type: 'AWS::EC2::SecurityGroup',
		Properties: {
			GroupName: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}',
			GroupDescription: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}',
			Tags: [
				{ Key: 'Name', Value: 'Janis ${self:custom.serviceName} SG ${param:humanReadableStage}' },
				{ Key: 'Owner', Value: 'Janis' },
				{ Key: 'Microservice', Value: '${self:custom.serviceName}' },
				{ Key: 'Stack', Value: '${param:humanReadableStage}' }
			],
			VpcId: '${param:vpcId}'
		}
	};

	return Array.isArray(currentResources)
		? [...currentResources, { [name]: resource }]
		: { ...currentResources, [name]: resource };
};

module.exports = ({ params: slsParams, resources, ...serviceConfig }, hookParams) => {

	// Set VPC config for each function
	if(serviceConfig.functions?.length) {
		serviceConfig.functions.forEach(functionObject => {
			Object.values(functionObject).forEach(fn => {
				fn.vpc = {
					securityGroupIds: { Ref: 'ServiceSecurityGroup' },
					subnetIds: '${param:subnetIds}'
				};
			});
		});
	}

	const newResources = addSecurityGroup(resources?.Resources || {});

	return {
		...serviceConfig,
		params: setSlsParams(slsParams, hookParams.variables),
		resources: {
			...resources,
			Resources: newResources
		}
	};
};
