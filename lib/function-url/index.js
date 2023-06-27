'use strict';

const upperCamelCase = require('../utils/upperCamelCase');
const { formatResources, hostedZone } = require('./base');

module.exports = ({ resources, ...serviceConfig }, { subdomainName, ...hookParams }) => {

	return {
		...serviceConfig,
		resources: {
			Resources: formatResources(resources, {
				...hookParams,
				hostedZone,
				rawSubdomainName: subdomainName,
				subdomainName: upperCamelCase(subdomainName)
			})
		}
	};
};
