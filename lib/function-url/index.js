'use strict';

const { upperCamelCase } = require('../utils/string');
const { formatResources, hostedZone } = require('./base');

module.exports = ({ resources, ...serviceConfig }, { subdomainName, ...hookParams }) => {

	return {
		...serviceConfig,
		resources: {
			...resources,
			Resources: formatResources(resources, {
				...hookParams,
				hostedZone,
				rawSubdomainName: subdomainName,
				subdomainName: upperCamelCase(subdomainName)
			})
		}
	};
};
