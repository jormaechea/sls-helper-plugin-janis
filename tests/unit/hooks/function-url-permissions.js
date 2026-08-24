'use strict';

const assert = require('assert').strict;

const { functionUrlPermissions } = require('../../..');

describe('Hooks', () => {

	describe('Function URL Permissions', () => {

		const expectedPermission = functionName => ({
			Type: 'AWS::Lambda::Permission',
			Properties: {
				FunctionName: { 'Fn::GetAtt': [`${functionName}LambdaFunction`, 'Arn'] },
				Action: 'lambda:InvokeFunction',
				Principal: '*',
				InvokedViaFunctionUrl: true
			}
		});

		it('Should not add any resource if no functions were declared', () => {

			assert.deepStrictEqual(functionUrlPermissions({}), {});
		});

		it('Should not add any resource if no function has a url', () => {

			const serviceConfig = {
				functions: [
					{ MyFunction: { handler: 'src/lambda/my-function.js' } }
				]
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), serviceConfig);
		});

		it('Should keep the current resources untouched if no function has a url', () => {

			const serviceConfig = {
				functions: [
					{ MyFunction: { handler: 'src/lambda/my-function.js' } }
				],
				resources: {
					Resources: {
						MyBucket: { Type: 'AWS::S3::Bucket' }
					}
				}
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), serviceConfig);
		});

		it('Should add the invoke function permission for a function with a public url', () => {

			const serviceConfig = {
				functions: [
					{ OrderWebhook: { handler: 'src/lambda/order/OrderWebhook.handler', url: true } }
				]
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), {
				functions: serviceConfig.functions,
				resources: {
					Resources: {
						OrderWebhookLambdaPermissionFnUrlInvokeFunction: expectedPermission('OrderWebhook')
					}
				}
			});
		});

		it('Should add one permission for each function with a public url', () => {

			const serviceConfig = {
				functions: [
					{ OrderCreatedWebhook: { handler: 'src/lambda/created.js', url: true } },
					{ NoUrlFunction: { handler: 'src/lambda/no-url.js' } },
					{ OrderCancelledWebhook: { handler: 'src/lambda/cancelled.js', url: true } }
				]
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), {
				functions: serviceConfig.functions,
				resources: {
					Resources: {
						OrderCreatedWebhookLambdaPermissionFnUrlInvokeFunction: expectedPermission('OrderCreatedWebhook'),
						OrderCancelledWebhookLambdaPermissionFnUrlInvokeFunction: expectedPermission('OrderCancelledWebhook')
					}
				}
			});
		});

		it('Should add the permission if the url is an object without an authorizer', () => {

			const serviceConfig = {
				functions: [
					{ MyFunction: { handler: 'src/lambda/my-function.js', url: { cors: true } } }
				]
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), {
				functions: serviceConfig.functions,
				resources: {
					Resources: {
						MyFunctionLambdaPermissionFnUrlInvokeFunction: expectedPermission('MyFunction')
					}
				}
			});
		});

		it('Should not add the permission if the url is authorized with aws_iam', () => {

			const serviceConfig = {
				functions: [
					{ MyFunction: { handler: 'src/lambda/my-function.js', url: { authorizer: 'aws_iam' } } }
				]
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), serviceConfig);
		});

		it('Should normalize the function name the same way serverless does', () => {

			const serviceConfig = {
				functions: [
					{ 'my-function_name': { handler: 'src/lambda/my-function.js', url: true } }
				]
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), {
				functions: serviceConfig.functions,
				resources: {
					Resources: {
						MyDashfunctionUnderscorenameLambdaPermissionFnUrlInvokeFunction: expectedPermission('MyDashfunctionUnderscorename')
					}
				}
			});
		});

		it('Should not override the current resources', () => {

			const serviceConfig = {
				functions: [
					{ OrderWebhook: { handler: 'src/lambda/order/OrderWebhook.handler', url: true } }
				],
				resources: {
					Description: 'My service resources',
					Resources: {
						MyBucket: { Type: 'AWS::S3::Bucket' }
					}
				}
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), {
				functions: serviceConfig.functions,
				resources: {
					Description: 'My service resources',
					Resources: {
						MyBucket: { Type: 'AWS::S3::Bucket' },
						OrderWebhookLambdaPermissionFnUrlInvokeFunction: expectedPermission('OrderWebhook')
					}
				}
			});
		});

		it('Should append the permission if the current resources are an array', () => {

			const serviceConfig = {
				functions: [
					{ OrderWebhook: { handler: 'src/lambda/order/OrderWebhook.handler', url: true } }
				],
				resources: {
					Resources: [
						{ MyBucket: { Type: 'AWS::S3::Bucket' } }
					]
				}
			};

			assert.deepStrictEqual(functionUrlPermissions(serviceConfig), {
				functions: serviceConfig.functions,
				resources: {
					Resources: [
						{ MyBucket: { Type: 'AWS::S3::Bucket' } },
						{ OrderWebhookLambdaPermissionFnUrlInvokeFunction: expectedPermission('OrderWebhook') }
					]
				}
			});
		});
	});
});
