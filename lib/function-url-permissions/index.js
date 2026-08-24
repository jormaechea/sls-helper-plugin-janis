'use strict';

const { addResource } = require('../utils/resources');

/**
 * IMPORTANT
 *
 * AWS is changing the Lambda function URL authorization model: from November 1st 2026, permission policies
 * must grant both `lambda:InvokeFunctionUrl` and `lambda:InvokeFunction`. Serverless only creates a permission
 * for the former (serverless/serverless#13147), and `AWS::Lambda::Permission` takes a single `Action`, so the
 * second action needs its own resource.
 *
 * `InvokedViaFunctionUrl: true` renders as `Condition: { Bool: { 'lambda:InvokedViaFunctionUrl': 'true' } }`,
 * which is the statement AWS documents for the NONE auth type. Do NOT use `FunctionUrlAuthType` here: that
 * property renders a `lambda:FunctionUrlAuthType` condition, which is the wrong key for `lambda:InvokeFunction`
 * and would grant a permission that does not authorize the URL call.
 *
 * This hook must be placed AFTER the `function` hooks, since it reads the functions already in the service config
 */

/**
 * Mirrors serverless `naming.getNormalizedFunctionName()` to build the same logical IDs it uses.
 * Do not replace this with `upperCamelCase`: serverless substitutes dashes and underscores instead of dropping them
 *
 * @param {string} functionName
 * @returns {string} The function name as serverless normalizes it for logical IDs
 */
const getNormalizedFunctionName = functionName => {

	const normalizedName = functionName.replace(/-/g, 'Dash').replace(/_/g, 'Underscore');

	return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
};

/**
 * Mirrors the condition in serverless `compileFunctionUrl()`: it only creates the permission when the URL is public.
 * With `aws_iam` authorization the caller signs the request, so granting `Principal: '*'` would expose the function
 *
 * @param {Object} functionConfig
 * @returns {boolean}
 */
const hasPublicFunctionUrl = ({ url }) => !!url && url.authorizer !== 'aws_iam';

const getInvokeFunctionPermission = normalizedFunctionName => ({
	Type: 'AWS::Lambda::Permission',
	Properties: {
		FunctionName: { 'Fn::GetAtt': [`${normalizedFunctionName}LambdaFunction`, 'Arn'] },
		Action: 'lambda:InvokeFunction',
		Principal: '*',
		InvokedViaFunctionUrl: true
	}
});

const getPublicUrlFunctionNames = functions => {

	return functions.reduce((functionNames, functionObject) => {

		Object.entries(functionObject).forEach(([functionName, functionConfig]) => {
			if(hasPublicFunctionUrl(functionConfig))
				functionNames.push(getNormalizedFunctionName(functionName));
		});

		return functionNames;
	}, []);
};

module.exports = ({ resources, ...serviceConfig }) => {

	const functionNames = getPublicUrlFunctionNames(serviceConfig.functions || []);

	if(!functionNames.length)
		return { ...serviceConfig, ...resources && { resources } };

	const newResources = functionNames.reduce((currentResources, functionName) => {
		return addResource(
			currentResources,
			`${functionName}LambdaPermissionFnUrlInvokeFunction`,
			getInvokeFunctionPermission(functionName)
		);
	}, resources);

	return {
		...serviceConfig,
		resources: newResources
	};
};
