'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { mockClient } = require('aws-sdk-client-mock');
const { RAMClient, ListResourcesCommand } = require('@aws-sdk/client-ram');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ParameterStore = require('../../../lib/utils/parameter-store');

describe('Parameter Store', () => {

	describe('getSharedParameter()', () => {

		let ramMock;
		let ssmMock;

		beforeEach(() => {
			ramMock = mockClient(RAMClient);
			ssmMock = mockClient(SSMClient);

			ramMock.on(ListResourcesCommand).resolves({
				resources: [{
					arn: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam',
					type: 'ssm:Parameter',
					resourceShareArn: 'arn:aws:ram:us-east-1:000000000000:resource-share/8aa109bd-254c-4c58-86a9-a0e82cad4cb8',
					status: 'AVAILABLE',
					creationTime: '2024-10-22T16:59:19.275000-03:00',
					lastUpdatedTime: '2024-10-22T16:59:21.802000-03:00',
					resourceRegionScope: 'REGIONAL'
				}]
			});

			ssmMock.on(GetParameterCommand).resolves({
				Parameter: {
					Name: 'SomeParam',
					Type: 'String',
					Value: '{"foo":"bar"}',
					Version: 1,
					LastModifiedDate: '2024-10-22T16:57:48.292000-03:00',
					ARN: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam',
					DataType: 'text'
				}
			});
		});

		afterEach(() => sinon.restore());

		it('Should resolve an empty object in local env', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				JANIS_LOCAL: '1'
			});

			const result = await ParameterStore.getSharedParameter('SomeParam');

			assert.deepStrictEqual(result, {});
		});

		it('Should reject if the shared parameter does not exist', async () => {

			ramMock.on(ListResourcesCommand).resolves({
				resources: []
			});

			await assert.rejects(() => ParameterStore.getSharedParameter('SomeParam'), {
				message: 'Could not find shared parameter SomeParam'
			});

			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand).length, 1);
			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand, {
				resourceOwner: 'OTHER-ACCOUNTS',
				resourceType: 'ssm:Parameter'
			}).length, 1);

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 0);
		});

		it('Should reject if the SSM parameter does not exist', async () => {

			ssmMock.on(GetParameterCommand).rejects(new Error('Parameter does not exist'));

			await assert.rejects(() => ParameterStore.getSharedParameter('SomeParam'));

			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand).length, 1);
			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand, {
				resourceOwner: 'OTHER-ACCOUNTS',
				resourceType: 'ssm:Parameter'
			}).length, 1);

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam'
			}).length, 1);
		});

		it('Should resolve the JSON-parsed parameter value if no errors occur', async () => {

			ramMock.on(ListResourcesCommand).resolves({
				resources: [{
					arn: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam',
					type: 'ssm:Parameter',
					resourceShareArn: 'arn:aws:ram:us-east-1:000000000000:resource-share/8aa109bd-254c-4c58-86a9-a0e82cad4cb8',
					status: 'AVAILABLE',
					creationTime: '2024-10-22T16:59:19.275000-03:00',
					lastUpdatedTime: '2024-10-22T16:59:21.802000-03:00',
					resourceRegionScope: 'REGIONAL'
				}]
			});

			const parameterValue = await ParameterStore.getSharedParameter('SomeParam');

			assert.deepStrictEqual(parameterValue, {
				foo: 'bar'
			});

			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand).length, 1);
			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand, {
				resourceOwner: 'OTHER-ACCOUNTS',
				resourceType: 'ssm:Parameter'
			}).length, 1);

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam'
			}).length, 1);
		});

		it('Should store the parameter in cache for consecutive calls', async () => {

			ramMock.on(ListResourcesCommand)
				.resolvesOnce({
					resources: [{
						arn: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam2',
						type: 'ssm:Parameter',
						resourceShareArn: 'arn:aws:ram:us-east-1:000000000000:resource-share/8aa109bd-254c-4c58-86a9-a0e82cad4cb8',
						status: 'AVAILABLE',
						creationTime: '2024-10-22T16:59:19.275000-03:00',
						lastUpdatedTime: '2024-10-22T16:59:21.802000-03:00',
						resourceRegionScope: 'REGIONAL'
					}]
				})
				.resolvesOnce({
					resources: [{
						arn: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam3',
						type: 'ssm:Parameter',
						resourceShareArn: 'arn:aws:ram:us-east-1:000000000000:resource-share/8aa109bd-254c-4c58-86a9-a0e82cad4cb8',
						status: 'AVAILABLE',
						creationTime: '2024-10-22T16:59:19.275000-03:00',
						lastUpdatedTime: '2024-10-22T16:59:21.802000-03:00',
						resourceRegionScope: 'REGIONAL'
					}]
				});
			ssmMock.on(GetParameterCommand)
				.resolves({
					Parameter: {
						Name: 'SomeParam2',
						Type: 'String',
						Value: '{"foo":"bar"}',
						Version: 1,
						LastModifiedDate: '2024-10-22T16:57:48.292000-03:00',
						ARN: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam2',
						DataType: 'text'
					}
				})
				.resolves({
					Parameter: {
						Name: 'SomeParam3',
						Type: 'String',
						Value: '{"foo":"bar"}',
						Version: 1,
						LastModifiedDate: '2024-10-22T16:57:48.292000-03:00',
						ARN: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam3',
						DataType: 'text'
					}
				});

			await ParameterStore.getSharedParameter('SomeParam2');
			await ParameterStore.getSharedParameter('SomeParam3');
			await ParameterStore.getSharedParameter('SomeParam3');

			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand).length, 2);
			assert.deepStrictEqual(ramMock.commandCalls(ListResourcesCommand, {
				resourceOwner: 'OTHER-ACCOUNTS',
				resourceType: 'ssm:Parameter'
			}).length, 2);

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 2);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam2'
			}).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: 'arn:aws:ssm:us-east-1:000000000000:parameter/SomeParam3'
			}).length, 1);
		});

	});

});
