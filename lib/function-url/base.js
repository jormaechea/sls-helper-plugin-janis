const { getCloudFrontDistribution } = require('../function-url/distribution');
const { getFormattedRouter } = require('../function-url/route-53');

const getUniqueFunctions = ({ functions: hookFunctions, rawSubdomainName }) => {

	return hookFunctions.reduce((uniqueFunctions, functionData, index ) => {
			
		if(!functionData.functionName)
			throw new Error(`Missing function name for ${rawSubdomainName}.functions[${index}]`);

		if(!functionData.path)
			throw new Error(`Missing path for ${rawSubdomainName}.${functionData.functionName} function`);
	
		uniqueFunctions[functionData.functionName] = functionData;

		return uniqueFunctions;
	}, {})
}

module.exports.formatResources = (resources, hookParams) => {

	if(!hookParams.subdomainName)
		throw new Error(`Missing subdomainName in function url definition`);

	if(!hookParams.acmCertificate)
		throw new Error(`Missing acmCertificate for ${hookParams.rawSubdomainName} subdomain`);

	hookParams.functions = getUniqueFunctions(hookParams)

	const { name: distributionName, distribution } = getCloudFrontDistribution(resources, hookParams);

	const { name: routerName, routerConfig } = getFormattedRouter(resources, hookParams);

	const currentResources = (resources && resources.Resources) || {};

	if(Array.isArray(currentResources)){
		
		const distributionIndex = currentResources.findIndex(resource => !!resource[distributionName])

		if(distributionIndex >= 0)
			currentResources[distributionIndex][distributionName] = distribution

		return [
			...currentResources,
			...(routerConfig ? [{ [routerName]: routerConfig }] : []),
			...(distributionIndex < 0) ? [{ [distributionName]: distribution }] : []
		]
	}

	return {
		...currentResources,
		...routerConfig && { [routerName]: routerConfig },
		[distributionName]: distribution
	};
};