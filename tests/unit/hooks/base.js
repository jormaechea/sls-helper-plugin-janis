'use strict';

const assert = require('assert').strict;

const { base } = require('../../..');

describe('Hooks', () => {

	describe('Base service', () => {

		it('Should throw if serviceName hook config is not defined', () => {
			assert.throws(() => base({}, {
				servicePort: 3000
			}));
		});

		it('Should throw if serviceName hook config is not a string', () => {
			assert.throws(() => base({}, {
				serviceName: ['invalid'],
				servicePort: 3000
			}));
		});

		it('Should throw if servicePort hook config is not defined', () => {
			assert.throws(() => base({}, {
				serviceName: 'Testing'
			}));
		});

		it('Should throw if servicePort hook config is not a string', () => {
			assert.throws(() => base({}, {
				serviceName: 'Testing',
				servicePort: ['invalid']
			}));
		});

		it('Should return the base service configuration', () => {

			const serviceConfig = base({}, {
				serviceName: 'Testing',
				servicePort: 3000
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'JanisTestingService',
				provider: {
					name: 'aws',
					runtime: 'nodejs10.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
					endpointType: 'REGIONAL'
				},
				package: {
					include: [
						'src/config/*'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					customDomain: {
						domainName: '${self:custom.serviceNameInLowerCase}.${self:custom.janisDomains.${self:custom.stage}}',
						basePath: 'api',
						stage: '${self:custom.stage}',
						createRoute53Record: true,
						endpointType: 'regional'
					},

					apiGatewayCaching: {
						enabled: '${self:custom.cacheEnabled.${self:custom.stage}, \'false\'}',
						clusterSize: '0.5',
						ttlInSeconds: 600 // 10 minutos
					},

					'serverless-offline': {
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true
					}
				}
			});
		});

		it('Should not override the original configuration', () => {

			const serviceConfig = base({
				custom: {
					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true,
				package: {
					include: [
						'custom/path/**'
					],
					exclude: [
						'something'
					]
				}
			}, {
				serviceName: 'Testing',
				servicePort: 3000
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'JanisTestingService',
				provider: {
					name: 'aws',
					runtime: 'nodejs10.x',
					memorySize: 256,
					stage: 'local',
					region: 'us-east-1',
					endpointType: 'REGIONAL'
				},
				package: {
					include: [
						'src/config/*',
						'custom/path/**'
					],
					exclude: [
						'something'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					customDomain: {
						domainName: '${self:custom.serviceNameInLowerCase}.${self:custom.janisDomains.${self:custom.stage}}',
						basePath: 'api',
						stage: '${self:custom.stage}',
						createRoute53Record: true,
						endpointType: 'regional'
					},

					apiGatewayCaching: {
						enabled: '${self:custom.cacheEnabled.${self:custom.stage}, \'false\'}',
						clusterSize: '0.5',
						ttlInSeconds: 600 // 10 minutos
					},

					'serverless-offline': {
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true
					},

					myCustomProp: {
						foo: 'bar'
					}
				},
				anotherProp: true
			});
		});

		it('Should use original configuration to override hook defaults', () => {

			const serviceConfig = base({
				provider: {
					memorySize: 512
				}
			}, {
				serviceName: 'Testing',
				servicePort: 3000
			});

			assert.deepStrictEqual(serviceConfig, {
				service: 'JanisTestingService',
				provider: {
					name: 'aws',
					runtime: 'nodejs10.x',
					memorySize: 512,
					stage: 'local',
					region: 'us-east-1',
					endpointType: 'REGIONAL'
				},
				package: {
					include: [
						'src/config/*'
					]
				},
				custom: {
					serviceName: 'Testing',
					serviceNameInLowerCase: 'testing',
					stage: '${opt:stage, self:provider.stage}',
					region: '${opt:region, self:provider.region}',

					janisDomains: {
						local: 'janis.localhost',
						beta: 'janisdev.in',
						qa: 'janisqa.in',
						prod: 'janis.in'
					},

					customDomain: {
						domainName: '${self:custom.serviceNameInLowerCase}.${self:custom.janisDomains.${self:custom.stage}}',
						basePath: 'api',
						stage: '${self:custom.stage}',
						createRoute53Record: true,
						endpointType: 'regional'
					},

					apiGatewayCaching: {
						enabled: '${self:custom.cacheEnabled.${self:custom.stage}, \'false\'}',
						clusterSize: '0.5',
						ttlInSeconds: 600 // 10 minutos
					},

					'serverless-offline': {
						port: 3000,
						host: '0.0.0.0',
						stage: 'local',
						prefix: 'api',
						printOutput: true
					}
				}
			});
		});
	});

});
