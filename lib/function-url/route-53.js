'use strict';

const shouldCreateRouter = (resources, subdomainName) => {

	if(!resources || !resources.Resources)
		return true;

	const resourceName = [`${subdomainName}RecordSet`];

	return Array.isArray(resources.Resources) ?
		!resources.Resources.find(resource => resource[resourceName]) :
		resources.Resources[resourceName];
};

const getNewRoute = (subdomainName, rawSubdomainName) => {

	const Name = rawSubdomainName + '.${self:custom.customDomain.domainName}';

	return {
		name: `${subdomainName}RecordSet`,
		routerConfig: {
			Type: 'AWS::Route53::RecordSet',
			Properties: {
				HostedZoneName: '${self:custom.customDomain.domainName}.',
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

module.exports.getFormattedRouter = (resources, { subdomainName, rawSubdomainName }) => {

	if(!shouldCreateRouter(resources, subdomainName))
		return {};

	return getNewRoute(subdomainName, rawSubdomainName);
};
