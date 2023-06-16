'use strict';

const upperCamelCase = require('../utils/upperCamelCase');
const { formatResources } = require('./base');

module.exports = ({ resources, ...serviceConfig }, { subdomainName, ...hookParams }) => {

	return {
		...serviceConfig,
		resources: {
			Resources: formatResources(resources, {
				...hookParams,
				rawSubdomainName: subdomainName,
				subdomainName: upperCamelCase(subdomainName)
			})
		}
	};
};
