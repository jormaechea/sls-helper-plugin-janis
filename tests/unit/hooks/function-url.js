'use strict';

const assert = require('assert').strict;

const { functionUrl } = require('../../../lib/plugin');

describe('Hooks', () => {

	describe('Function Url', () => {

		const functionDefinition = {
			functionName: 'LambdaUrlTest',
			path: '/LambdaUrlTest'
		};

		const functionUrlConfig = {
			subdomainName: 'lambda_url',
			acmCertificate: '123456789',
			functions: [functionDefinition]
		};

		const resourcesName = 'lambda_url.${self:custom.customDomain.domainName}';

		const getSampleOrigin = (functionName = functionDefinition.functionName) => ({
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
			CustomOriginConfig: {
				HTTPPort: 80,
				HTTPSPort: 443,
				OriginProtocolPolicy: 'https-only',
				OriginSSLProtocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2']
			}
		});

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

		const sampleCacheBehavior = {
			...defaultCache,
			TargetOriginId: functionDefinition.functionName,
			PathPattern: functionDefinition.path
		};

		const sampleDistribution = {
			Type: 'AWS::CloudFront::Distribution',
			Properties: {
				DistributionConfig: {
					Enabled: true,
					PriceClass: 'PriceClass_100',
					HttpVersion: 'http2',
					Comment: resourcesName,
					Origins: [getSampleOrigin()],
					CacheBehaviors: [sampleCacheBehavior],
					DefaultCacheBehavior: {
						...defaultCache,
						TargetOriginId: functionDefinition.functionName
					},
					Aliases: [
						resourcesName
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
									functionUrlConfig.acmCertificate
								]
							]
						}
					}
				}
			}
		};

		const sampleRouterRecordSet = {
			Type: 'AWS::Route53::RecordSet',
			Properties: {
				HostedZoneName: '${self:custom.customDomain.domainName}.',
				Type: 'A',
				Name: resourcesName,
				AliasTarget: {
					HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront zone ID
					DNSName: {
						'Fn::GetAtt': 'LambdaUrlCloudFrontDistribution.DomainName'
					}
				}
			}
		};

		context('Config validation', () => {

			it('Should throw if any function path param is missing', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					functions: [{ ...functionDefinition, path: undefined }]
				}), {
					message: `Missing path for ${functionUrlConfig.subdomainName}.${functionDefinition.functionName} function`
				});
			});

			it('Should throw if domain param is passed as empty', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					functions: [{ ...functionDefinition, path: '' }]
				}), {
					message: `Missing path for ${functionUrlConfig.subdomainName}.${functionDefinition.functionName} function`
				});
			});

			it('Should throw if any functionName is missing', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					functions: [{ ...functionDefinition, functionName: undefined }]
				}), {
					message: `Missing function name for ${functionUrlConfig.subdomainName}.functions[0]`
				});
			});

			it('Should throw if any functionName is passed as empty', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					functions: [{ ...functionDefinition, functionName: '' }]
				}), {
					message: `Missing function name for ${functionUrlConfig.subdomainName}.functions[0]`
				});
			});

			it('Should throw if subdomain is missing', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					subdomainName: undefined
				}), {
					message: 'Missing subdomainName in function url definition'
				});
			});

			it('Should throw if subdomain is passed as empty', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					subdomainName: ''
				}), {
					message: 'Missing subdomainName in function url definition'
				});
			});

			it('Should throw if acmCertificate is missing', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					acmCertificate: undefined
				}), {
					message: `Missing acmCertificate for ${functionUrlConfig.subdomainName} subdomain`
				});
			});

			it('Should throw if acmCertificate is passed as empty', () => {

				assert.throws(() => functionUrl({}, {
					...functionUrlConfig,
					acmCertificate: ''
				}), {
					message: `Missing acmCertificate for ${functionUrlConfig.subdomainName} subdomain`
				});
			});
		});

		context('CloudFront Distribution', () => {

			it('Should create a CloudFront Distribution', () => {

				const result = functionUrl({
					resources: {
						Resources: [{ LambdaUrlRecordSet: sampleRouterRecordSet }]
					}
				}, functionUrlConfig);

				assert.deepStrictEqual(result.resources.Resources[1].LambdaUrlCloudFrontDistribution, sampleDistribution);
			});

			it('Should add origin to existing distribution', () => {

				const result = functionUrl({ resources: { Resources: { LambdaUrlCloudFrontDistribution: sampleDistribution } } }, {
					...functionUrlConfig,
					functions: [{
						functionName: 'LambdaUrlTest2',
						path: '/LambdaUrlTest2'
					}]
				});

				assert.deepStrictEqual(result.resources.Resources.LambdaUrlCloudFrontDistribution, {
					...sampleDistribution,
					Properties: {
						DistributionConfig: {
							...sampleDistribution.Properties.DistributionConfig,
							Origins: [getSampleOrigin(), getSampleOrigin('LambdaUrlTest2')],
							CacheBehaviors: [
								sampleCacheBehavior,
								{
									...defaultCache,
									TargetOriginId: 'LambdaUrlTest2',
									PathPattern: '/LambdaUrlTest2'
								}
							]
						}

					}
				});
			});

			it('Should not add origin if it already exists', () => {

				const result = functionUrl({ resources: { Resources: { LambdaUrlCloudFrontDistribution: sampleDistribution } } }, functionUrlConfig);

				assert.deepStrictEqual(result.resources.Resources.LambdaUrlCloudFrontDistribution, sampleDistribution);
			});
		});

		context('Route53 record set', () => {

			it('Should create a new Route53 Record Set', () => {

				const result = functionUrl({}, functionUrlConfig);

				assert.deepStrictEqual(result.resources.Resources.LambdaUrlRecordSet, sampleRouterRecordSet);
			});

			it('Should add new Route53 Record Set to resources array', () => {

				const result = functionUrl({
					resources: {
						Resources: [{ LambdaUrl2RecordSet: sampleRouterRecordSet }]
					}
				}, functionUrlConfig);

				assert.deepStrictEqual(result.resources.Resources[1].LambdaUrlRecordSet, sampleRouterRecordSet);
			});

			it('Should not create a new Route53 Record Set', () => {

				const result = functionUrl({
					resources: {
						Resources: [{ LambdaUrlCloudFrontDistribution: sampleDistribution }, { LambdaUrlRecordSet: sampleRouterRecordSet }]
					}
				}, {
					...functionUrlConfig,
					functions: [{
						functionName: 'LambdaUrlTest2',
						path: '/LambdaUrlTest2'
					}]
				});

				assert.deepStrictEqual(result.resources.Resources, [
					{
						LambdaUrlCloudFrontDistribution: {
							...sampleDistribution,
							Properties: {
								DistributionConfig: {
									...sampleDistribution.Properties.DistributionConfig,
									Origins: [getSampleOrigin(), getSampleOrigin('LambdaUrlTest2')],
									CacheBehaviors: [
										sampleCacheBehavior,
										{
											...defaultCache,
											TargetOriginId: 'LambdaUrlTest2',
											PathPattern: '/LambdaUrlTest2'
										}
									]
								}

							}
						}
					},
					{ LambdaUrlRecordSet: sampleRouterRecordSet }
				]);
			});
		});
	});
});
