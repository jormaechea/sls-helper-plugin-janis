'use strict';

const assert = require('assert').strict;

const AddInvokeFunctionPermissions = require('../../../lib/plugins/add-invoke-function-permissions');

describe('Plugins', () => {

	describe('Add Invoke Function Permissions', () => {

		const makeServerless = template => ({
			service: {
				provider: {
					compiledCloudFormationTemplate: template
				}
			},
			cli: { log: () => {} }
		});

		const invokeFunctionUrlPermission = {
			Type: 'AWS::Lambda::Permission',
			Properties: {
				FunctionName: { 'Fn::GetAtt': ['MyLambdaFunction', 'Arn'] },
				Action: 'lambda:InvokeFunctionUrl',
				Principal: '*',
				FunctionUrlAuthType: 'NONE'
			}
		};

		it('Should add a twin lambda:InvokeFunction permission scoped to function URL invocation', () => {

			const template = {
				Resources: {
					MyLambdaPermissionFnUrl: { ...invokeFunctionUrlPermission }
				}
			};

			const plugin = new AddInvokeFunctionPermissions(makeServerless(template));
			plugin.hooks['before:aws:package:finalize:mergeCustomProviderResources']();

			assert.deepStrictEqual(template.Resources.MyLambdaPermissionFnUrlInvokeFunction, {
				Type: 'AWS::Lambda::Permission',
				Properties: {
					FunctionName: { 'Fn::GetAtt': ['MyLambdaFunction', 'Arn'] },
					Action: 'lambda:InvokeFunction',
					Principal: '*',
					InvokedViaFunctionUrl: true
				}
			});

			// Original permission must remain untouched
			assert.deepStrictEqual(template.Resources.MyLambdaPermissionFnUrl, invokeFunctionUrlPermission);
		});

		it('Should not modify permissions with a different action', () => {

			const template = {
				Resources: {
					ApiGatewayPermission: {
						Type: 'AWS::Lambda::Permission',
						Properties: { Action: 'lambda:InvokeFunction', Principal: 'apigateway.amazonaws.com' }
					}
				}
			};

			const plugin = new AddInvokeFunctionPermissions(makeServerless(template));
			plugin.hooks['before:aws:package:finalize:mergeCustomProviderResources']();

			assert.deepStrictEqual(Object.keys(template.Resources), ['ApiGatewayPermission']);
		});

		it('Should ignore resources that are not lambda permissions', () => {

			const template = {
				Resources: {
					MyLambdaFunction: { Type: 'AWS::Lambda::Function', Properties: {} }
				}
			};

			const plugin = new AddInvokeFunctionPermissions(makeServerless(template));
			plugin.hooks['before:aws:package:finalize:mergeCustomProviderResources']();

			assert.deepStrictEqual(Object.keys(template.Resources), ['MyLambdaFunction']);
		});

		it('Should be idempotent, not duplicating an already added twin permission', () => {

			const template = {
				Resources: {
					MyLambdaPermissionFnUrl: { ...invokeFunctionUrlPermission },
					MyLambdaPermissionFnUrlInvokeFunction: { existing: true }
				}
			};

			const plugin = new AddInvokeFunctionPermissions(makeServerless(template));
			plugin.hooks['before:aws:package:finalize:mergeCustomProviderResources']();

			assert.deepStrictEqual(template.Resources.MyLambdaPermissionFnUrlInvokeFunction, { existing: true });
		});

		it('Should not fail when the template has no Resources', () => {

			const plugin = new AddInvokeFunctionPermissions(makeServerless({}));

			assert.doesNotThrow(() => plugin.hooks['before:aws:package:finalize:mergeCustomProviderResources']());
		});

		it('Should hook on the before stage of mergeCustomProviderResources', () => {

			const plugin = new AddInvokeFunctionPermissions(makeServerless({}));

			assert.deepStrictEqual(Object.keys(plugin.hooks), ['before:aws:package:finalize:mergeCustomProviderResources']);
		});

		it('Should add the twin permission before split-stacks migrates permissions out of the root template', () => {

			const template = {
				Resources: {
					MyLambdaPermissionFnUrl: { ...invokeFunctionUrlPermission }
				}
			};

			const nestedStack = { Resources: {} };

			const plugin = new AddInvokeFunctionPermissions(makeServerless(template));

			// serverless-plugin-split-stacks hooks on the after stage of the same lifecycle event and moves
			// every AWS::Lambda::Permission to a nested stack, deleting it from the root template.
			const splitStacks = {
				hooks: {
					'after:aws:package:finalize:mergeCustomProviderResources': () => {
						Object.entries(template.Resources).forEach(([logicalId, resource]) => {
							if(resource.Type === 'AWS::Lambda::Permission') {
								nestedStack.Resources[logicalId] = resource;
								delete template.Resources[logicalId];
							}
						});
					}
				}
			};

			// split-stacks is registered first in janis.base, so registration order must not matter:
			// Serverless runs every before hook ahead of every after hook.
			const lifecycleEvent = 'aws:package:finalize:mergeCustomProviderResources';

			['before:', '', 'after:'].forEach(stage => {
				[splitStacks, plugin].forEach(({ hooks }) => {
					const hook = hooks[`${stage}${lifecycleEvent}`];
					if(hook)
						hook();
				});
			});

			assert.deepStrictEqual(Object.keys(nestedStack.Resources).sort(), [
				'MyLambdaPermissionFnUrl',
				'MyLambdaPermissionFnUrlInvokeFunction'
			]);

			assert.strictEqual(nestedStack.Resources.MyLambdaPermissionFnUrlInvokeFunction.Properties.Action, 'lambda:InvokeFunction');
		});
	});
});
