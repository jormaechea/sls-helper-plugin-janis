'use strict';

const defaultCache = {
	ViewerProtocolPolicy: 'redirect-to-https',
	Compress: true,
	DefaultTTL: 0,
	AllowedMethods: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
	CachedMethods: ['GET', 'HEAD'],
	ForwardedValues: {
		QueryString: false,
		Headers: ['Accept', 'x-api-key', 'Authorization'],
		Cookies: {
			Forward: 'none'
		}
	}
};

const CustomOriginConfig = {
	HTTPPort: 80,
	HTTPSPort: 443,
	OriginProtocolPolicy: 'https-only',
	OriginSSLProtocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2']
};

const getCurrentDistribution = (resources, { subdomainName }) => {

	if(!resources || !resources.Resources)
		return;

	const resourceName = [`${subdomainName}CloudFrontDistribution`];

	if(Array.isArray(resources.Resources)) {

		const distribution = resources.Resources.find(resource => resource[resourceName]);

		return distribution && distribution[resourceName];
	}

	return resources.Resources[resourceName];
};

const getBaseDistribution = ({ hostedZone, subdomainName, acmCertificate, rawSubdomainName }) => {

	const alias = `${rawSubdomainName}.${hostedZone}`;

	return {

		name: `${subdomainName}CloudFrontDistribution`,
		resource: {
			Type: 'AWS::CloudFront::Distribution',
			Properties: {
				DistributionConfig: {
					Enabled: true,
					PriceClass: 'PriceClass_100',
					HttpVersion: 'http2',
					Comment: alias,
					Origins: [],
					CacheBehaviors: [],
					Aliases: [
						alias
					],
					ViewerCertificate: {
						SslSupportMethod: 'sni-only',
						MinimumProtocolVersion: 'TLSv1.2_2019',
						AcmCertificateArn: {
							'Fn::Join': [
								':',
								[
									'arn:aws:acm',
									'${self:custom.region}',
									{ Ref: 'AWS::AccountId' },
									acmCertificate
								]
							]
						}
					}
				}
			}
		}
	};
};

const formatOrigin = ({ functionName }) => ({
	DomainName: {
		'Fn::Select': [
			2,
			{
				'Fn::Split': [
					'/',
					{
						'Fn::GetAtt': [
							`${functionName}LambdaFunctionUrl`,
							'FunctionUrl'
						]
					}
				]
			}
		]
	},
	Id: functionName,
	OriginPath: '',
	CustomOriginConfig
});

const formatCacheBehavior = ({ functionName, path }) => ({
	TargetOriginId: functionName,
	...defaultCache,
	PathPattern: path
});

module.exports.getCloudFrontDistribution = (resources, hookParams) => {

	const baseDistribution = getBaseDistribution(hookParams);

	const distribution = getCurrentDistribution(resources, hookParams) || baseDistribution.resource;

	const { Origins: currentOrigins } = { ...distribution.Properties.DistributionConfig };

	const functions = Object.values(hookParams.functions);

	functions.forEach(functionConfig => {

		if(!currentOrigins.some(({ Id }) => functionConfig.functionName === Id)) {

			distribution.Properties.DistributionConfig.Origins.push(formatOrigin(functionConfig));
			distribution.Properties.DistributionConfig.CacheBehaviors.push(formatCacheBehavior(functionConfig));
		}
	});

	if(!distribution.Properties.DistributionConfig.DefaultCacheBehavior) {

		distribution.Properties.DistributionConfig.DefaultCacheBehavior = {
			...defaultCache,
			TargetOriginId: functions[0].functionName // hasta encontrar como bloquearlo
		};
	}

	return { name: baseDistribution.name, distribution };
};
