'use strict';

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { isLocal } = require('./is-local');

const ssmClient = new SSMClient();

const parametersCache = {};

const getParameter = async parameterNameOrArn => {

	const { Parameter } = await ssmClient.send(new GetParameterCommand({
		Name: parameterNameOrArn
	}));

	return JSON.parse(Parameter.Value);
};

module.exports.getSharedParameter = async parameterName => {

	if(isLocal())
		return {};

	if(parametersCache[parameterName])
		return parametersCache[parameterName];

	const devopsAccountId = process.env.DEVOPS_ACCOUNT_ID;

	if(!devopsAccountId)
		throw new Error(`Missing DEVOPS_ACCOUNT_ID env var to resolve shared parameter ${parameterName}`);

	const region = process.env.AWS_REGION || 'us-east-1';

	const arn = `arn:aws:ssm:${region}:${devopsAccountId}:parameter/${parameterName.replace(/^\//, '')}`;

	parametersCache[parameterName] = await getParameter(arn);

	return parametersCache[parameterName];
};

module.exports.getLocalParameter = getParameter;

module.exports.clearCache = () => {
	Object.keys(parametersCache).forEach(key => delete parametersCache[key]);
};
