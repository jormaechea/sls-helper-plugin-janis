'use strict';

const assert = require('assert').strict;

const { dbConfig } = require('../../..');

describe('Hooks', () => {

	describe('DB Config', () => {

		context('Config validation', () => {

			it('Should throw if secret param is missing', () => {

				assert.throws(() => dbConfig({}, {}), {
					message: /secret/
				});
			});

			it('Should throw if secretName param is passed as empty', () => {

				assert.throws(() => dbConfig({}, {
					secret: { foo: 'bar' },
					secretName: ''
				}), {
					message: /secretName/
				});
			});

			it('Should throw if secret param is passed as a non-string and non-object', () => {

				assert.throws(() => dbConfig({}, {
					secret: 1
				}), {
					message: /secret/
				});

				assert.throws(() => dbConfig({}, {
					secret: ['hi']
				}), {
					message: /secret/
				});

				assert.throws(() => dbConfig({}, {
					secret: true
				}), {
					message: /secret/
				});
			});

			it('Should throw if passwordKey param is passed as empty', () => {

				assert.throws(() => dbConfig({}, {
					secret: { foo: 'bar' },
					passwordKey: ''
				}), {
					message: /passwordKey/
				});
			});

			it('Should throw if passwordLength param is passed as empty', () => {

				assert.throws(() => dbConfig({}, {
					secret: { foo: 'bar' },
					passwordLength: null
				}), {
					message: /passwordLength/
				});
			});

			it('Should throw if passwordLength param is passed as a non-numeric value', () => {

				assert.throws(() => dbConfig({}, {
					secret: { foo: 'bar' },
					passwordLength: 'hi'
				}), {
					message: /passwordLength/
				});
			});

			it('Should throw if passwordLength param is passed as a non-integer value', () => {

				assert.throws(() => dbConfig({}, {
					secret: { foo: 'bar' },
					passwordLength: 100.5
				}), {
					message: /passwordLength/
				});
			});

			it('Should throw if passwordLength param is passed as an integer lesser than 32 value', () => {

				assert.throws(() => dbConfig({}, {
					secret: { foo: 'bar' },
					passwordLength: 10
				}), {
					message: /passwordLength/
				});
			});
		});

		context('Secret generation', () => {
			it('Should return the service configuration with default values and stringified secret object', () => {

				const serviceConfig = dbConfig({}, {
					secret: {
						foo: 'bar'
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					resources: {
						Resources: {
							ServiceDatabaseConfig: {
								Type: 'AWS::SecretsManager::Secret',
								Properties: {
									Name: 'janis/${self:custom.serviceCode}/${self:custom.stage}/db-config',
									Description: 'Database config secret for janis ${self:custom.serviceCode} ${self:custom.stage}',
									GenerateSecretString: {
										SecretStringTemplate: '{"foo":"bar"}',
										GenerateStringKey: 'password',
										PasswordLength: 40
									}
								}
							}
						}
					}
				});
			});

			it('Should return the service configuration with default values and already-stringified secret object', () => {

				const serviceConfig = dbConfig({}, {
					secret: '{"foo": "bar"}'
				});

				assert.deepStrictEqual(serviceConfig, {
					resources: {
						Resources: {
							ServiceDatabaseConfig: {
								Type: 'AWS::SecretsManager::Secret',
								Properties: {
									Name: 'janis/${self:custom.serviceCode}/${self:custom.stage}/db-config',
									Description: 'Database config secret for janis ${self:custom.serviceCode} ${self:custom.stage}',
									GenerateSecretString: {
										SecretStringTemplate: '{"foo": "bar"}',
										GenerateStringKey: 'password',
										PasswordLength: 40
									}
								}
							}
						}
					}
				});
			});

			it('Should return the service configuration with all optional custom values', () => {

				const serviceConfig = dbConfig({}, {
					secret: {
						foo: 'bar'
					},
					secretName: 'my-custom-name-with-vars-${self:custom.stage}',
					description: 'Custom secret description',
					passwordKey: 'pwd',
					passwordLength: 50
				});

				assert.deepStrictEqual(serviceConfig, {
					resources: {
						Resources: {
							ServiceDatabaseConfig: {
								Type: 'AWS::SecretsManager::Secret',
								Properties: {
									Name: 'my-custom-name-with-vars-${self:custom.stage}',
									Description: 'Custom secret description',
									GenerateSecretString: {
										SecretStringTemplate: '{"foo":"bar"}',
										GenerateStringKey: 'pwd',
										PasswordLength: 50
									}
								}
							}
						}
					}
				});
			});

			it('Should not override any previous resources or config', () => {

				const serviceConfig = dbConfig({
					custom: {
						foo: 'bar'
					},
					resources: {
						Resources: {
							OtherResource: {
								Type: 'AWS::S3::Bucket',
								Properties: {}
							}
						}
					}
				}, {
					secret: {
						foo: 'bar'
					}
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar'
					},
					resources: {
						Resources: {
							OtherResource: {
								Type: 'AWS::S3::Bucket',
								Properties: {}
							},
							ServiceDatabaseConfig: {
								Type: 'AWS::SecretsManager::Secret',
								Properties: {
									Name: 'janis/${self:custom.serviceCode}/${self:custom.stage}/db-config',
									Description: 'Database config secret for janis ${self:custom.serviceCode} ${self:custom.stage}',
									GenerateSecretString: {
										SecretStringTemplate: '{"foo":"bar"}',
										GenerateStringKey: 'password',
										PasswordLength: 40
									}
								}
							}
						}
					}
				});
			});
		});
	});

});
