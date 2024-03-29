'use strict';

/**
 * @param {Array|Object} resources
 * @param {String} subdomainName
 * @returns {Boolean} True if resource was not already created
*/
const shouldCreateRecordSet = (resources, subdomainName) => {

	if(!resources || !resources.Resources)
		return true;

	const resourceName = [`${subdomainName}RecordSet`];

	return Array.isArray(resources.Resources) ?
		!resources.Resources.find(resource => resource[resourceName]) :
		!resources.Resources[resourceName];
};

const getRecordSet = (hostedZone, subdomainName, rawSubdomainName) => {

	const Name = `${rawSubdomainName}.${hostedZone}`;

	return {
		name: `${subdomainName}RecordSet`,
		recordSetConfig: {
			Type: 'AWS::Route53::RecordSet',
			Properties: {
				HostedZoneName: `${hostedZone}.`,
				Type: 'A',
				Name,
				AliasTarget: {
					HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront zone ID
					DNSName: {
						'Fn::GetAtt': `${subdomainName}CloudFrontDistribution.DomainName`
					}
				}
			}
		}
	};
};

module.exports.getFormattedRecordSet = (resources, { hostedZone, subdomainName, rawSubdomainName }) => {

	if(!shouldCreateRecordSet(resources, subdomainName))
		return {};

	return getRecordSet(hostedZone, subdomainName, rawSubdomainName);
};
