'use strict';

const addResource = (serviceResources, newResourceLogicalName, newResourceDefinition) => {

	const currentResources = serviceResources?.Resources || {};

	if(Array.isArray(currentResources)) {

		const existingResourceIndex = currentResources.findIndex(resource => !!resource[newResourceLogicalName]);

		if(existingResourceIndex >= 0)
			currentResources[existingResourceIndex][newResourceLogicalName] = newResourceDefinition;
		else {
			currentResources.push({
				[newResourceLogicalName]: newResourceDefinition
			});
		}

		return {
			...serviceResources,
			Resources: currentResources
		};
	}

	return {
		...serviceResources,
		Resources: {
			...currentResources,
			[newResourceLogicalName]: newResourceDefinition
		}
	};
};

module.exports = {
	addResource
};
