'use strict';

const { RAMClient, ListResourcesCommand } = require('@aws-sdk/client-ram');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { isLocal } = require('./is-local');

const ssmClient = new SSMClient();
const ramClient = new RAMClient();

const parametersCache = {};

const getParameter = async parameterNameOrArn => {

	if(parametersCache[parameterNameOrArn])
		return parametersCache[parameterNameOrArn];

	const { Parameter } = await ssmClient.send(new GetParameterCommand({
		Name: parameterNameOrArn
	}));

	parametersCache[parameterNameOrArn] = JSON.parse(Parameter.Value);

	return parametersCache[parameterNameOrArn];
};

// For possible future usage
// module.exports.getLocalParameter = parameterName => getParameter(parameterName);

module.exports.getSharedParameter = async parameterName => {

	if(isLocal())
		return {};

	const { resources } = await ramClient.send(new ListResourcesCommand({
		resourceOwner: 'OTHER-ACCOUNTS',
		resourceType: 'ssm:Parameter'

	}));

	const sharedParameter = resources.find(parameter => parameter.arn.endsWith(`:parameter/${parameterName.replace(/^\//, '')}`));

	if(!sharedParameter)
		throw new Error(`Could not find shared parameter ${parameterName}`);

	return getParameter(sharedParameter.arn);
};
