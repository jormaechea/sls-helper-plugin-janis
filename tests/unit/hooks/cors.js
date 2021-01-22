'use strict';

const assert = require('assert').strict;

const { cors } = require('../../..');

describe('Hooks', () => {

	describe('CORS', () => {

		const initialConfig = {
			custom: {
				foo: 'bar'
			},
			baz: true
		};

		const defaultHeaders = [
			'authorization',
			'content-type',
			'janis-api-key',
			'janis-api-secret',
			'janis-client',
			'janis-service',
			'janis-entity',
			'x-api-key',
			'x-janis-page',
			'x-janis-page-size'
		];

		const defaultOrigins = ['*'];

		const configWithDefaultCors = {
			custom: {
				foo: 'bar',
				cors: {
					origins: [...defaultOrigins],
					headers: [...defaultHeaders],
					allowCredentials: true,
					maxAge: 600
				}
			},
			baz: true
		};

		it('Should return the service configuration unchanged if corsConfig is false', () => {

			const serviceConfig = cors({ ...initialConfig }, false);

			assert.deepStrictEqual(serviceConfig, initialConfig);
		});

		it('Should return the service configuration with default CORS if corsConfig is not defined', () => {

			const serviceConfig = cors({ ...initialConfig });

			assert.deepStrictEqual(serviceConfig, configWithDefaultCors);
		});

		it('Should return the service configuration with default CORS if corsConfig is true', () => {

			const { custom, ...initialConfigWithNoCustomProps } = initialConfig;

			const serviceConfig = cors({ ...initialConfigWithNoCustomProps }, true);

			const { custom: { cors: defaultCors } } = configWithDefaultCors;

			assert.deepStrictEqual(serviceConfig, {
				...configWithDefaultCors,
				custom: {
					cors: defaultCors
				}
			});
		});

		it('Should throw if corsConfig is an array', () => {
			assert.throws(() => cors({ ...initialConfig }, []));
		});

		it('Should throw if corsConfig is a number', () => {
			assert.throws(() => cors({ ...initialConfig }, 100));
		});

		it('Should throw if corsConfig is a string', () => {
			assert.throws(() => cors({ ...initialConfig }, 'foo'));
		});

		it('Should throw if corsConfig is null', () => {
			assert.throws(() => cors({ ...initialConfig }, null));
		});

		context('Config merge', () => {

			it('Should return the default headers and origins if custom props are not defined', () => {

				const serviceConfig = cors({ ...initialConfig }, {});

				assert.deepStrictEqual(serviceConfig, configWithDefaultCors);
			});

			it('Should merge with the default headers and origins if custom props are defined', () => {

				const customHeaders = [
					'x-foo'
				];

				const customOrigins = [
					'http://example.com'
				];

				const serviceConfig = cors({ ...initialConfig }, {
					headers: customHeaders,
					origins: customOrigins
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar',
						cors: {
							origins: [...defaultOrigins, ...customOrigins],
							headers: [...defaultHeaders, ...customHeaders],
							allowCredentials: true,
							maxAge: 600

						}
					},
					baz: true
				});
			});

			it('Should override allowCredentials and maxAge if they are defined', () => {

				const serviceConfig = cors({ ...initialConfig }, {
					allowCredentials: false,
					maxAge: 60
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar',
						cors: {
							origins: [...defaultOrigins],
							headers: [...defaultHeaders],
							allowCredentials: false,
							maxAge: 60
						}
					},
					baz: true
				});
			});

			it('Should allow to override maxAge as null', () => {

				const serviceConfig = cors({ ...initialConfig }, {
					allowCredentials: false,
					maxAge: null
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar',
						cors: {
							origins: [...defaultOrigins],
							headers: [...defaultHeaders],
							allowCredentials: false,
							maxAge: null
						}
					},
					baz: true
				});
			});
		});

		context('Config replacement', () => {

			it('Should return the default headers and origins if custom props are not defined', () => {

				const serviceConfig = cors({ ...initialConfig }, { replace: true });

				assert.deepStrictEqual(serviceConfig, configWithDefaultCors);
			});

			it('Should replace the default headers and origins if custom props are defined', () => {

				const customHeaders = [
					'x-foo'
				];

				const customOrigins = [
					'http://example.com'
				];

				const serviceConfig = cors({ ...initialConfig }, {
					replace: true,
					headers: customHeaders,
					origins: customOrigins
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar',
						cors: {
							origins: [...customOrigins],
							headers: [...customHeaders],
							allowCredentials: true,
							maxAge: 600

						}
					},
					baz: true
				});
			});

			it('Should override allowCredentials and maxAge if they are defined', () => {

				const serviceConfig = cors({ ...initialConfig }, {
					replace: true,
					allowCredentials: false,
					maxAge: 60
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar',
						cors: {
							origins: [...defaultOrigins],
							headers: [...defaultHeaders],
							allowCredentials: false,
							maxAge: 60
						}
					},
					baz: true
				});
			});

			it('Should allow to override maxAge as null', () => {

				const serviceConfig = cors({ ...initialConfig }, {
					replace: true,
					allowCredentials: false,
					maxAge: null
				});

				assert.deepStrictEqual(serviceConfig, {
					custom: {
						foo: 'bar',
						cors: {
							origins: [...defaultOrigins],
							headers: [...defaultHeaders],
							allowCredentials: false,
							maxAge: null
						}
					},
					baz: true
				});
			});
		});
	});

});
