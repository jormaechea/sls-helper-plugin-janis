'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { mockClient } = require('aws-sdk-client-mock');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ParameterStore = require('../../../lib/utils/parameter-store');

const FAKE_DEVOPS_ACCOUNT_ID = '000000000000';
const FAKE_REGION = 'us-east-1';

describe('Parameter Store', () => {

	describe('getSharedParameter()', () => {

		let ssmMock;

		beforeEach(() => {
			ssmMock = mockClient(SSMClient);

			ssmMock.on(GetParameterCommand).resolves({
				Parameter: {
					Name: 'SomeParam',
					Type: 'String',
					Value: '{"foo":"bar"}',
					Version: 1,
					LastModifiedDate: '2024-10-22T16:57:48.292000-03:00',
					ARN: `arn:aws:ssm:${FAKE_REGION}:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeParam`,
					DataType: 'text'
				}
			});
		});

		afterEach(() => {
			sinon.restore();
			ParameterStore.clearCache();
		});

		it('Should resolve an empty object in local env', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				JANIS_LOCAL: '1'
			});

			const result = await ParameterStore.getSharedParameter('SomeParam');

			assert.deepStrictEqual(result, {});
		});

		it('Should reject if DEVOPS_ACCOUNT_ID env var is missing', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				DEVOPS_ACCOUNT_ID: undefined,
				JANIS_LOCAL: undefined
			});

			await assert.rejects(
				() => ParameterStore.getSharedParameter('SomeParam'),
				{ message: 'Missing DEVOPS_ACCOUNT_ID env var to resolve shared parameter SomeParam' }
			);

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 0);
		});

		it('Should resolve the JSON-parsed parameter value using the constructed ARN', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				DEVOPS_ACCOUNT_ID: FAKE_DEVOPS_ACCOUNT_ID,
				AWS_REGION: FAKE_REGION,
				JANIS_LOCAL: undefined
			});

			const parameterValue = await ParameterStore.getSharedParameter('SomeParam');

			assert.deepStrictEqual(parameterValue, { foo: 'bar' });

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: `arn:aws:ssm:${FAKE_REGION}:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeParam`
			}).length, 1);
		});

		it('Should strip a leading slash from the parameter name when building the ARN', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				DEVOPS_ACCOUNT_ID: FAKE_DEVOPS_ACCOUNT_ID,
				AWS_REGION: FAKE_REGION,
				JANIS_LOCAL: undefined
			});

			await ParameterStore.getSharedParameter('/SomeLeadingSlashParam');

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: `arn:aws:ssm:${FAKE_REGION}:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeLeadingSlashParam`
			}).length, 1);
		});

		it('Should use us-east-1 as default region when AWS_REGION is not set', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				DEVOPS_ACCOUNT_ID: FAKE_DEVOPS_ACCOUNT_ID,
				AWS_REGION: undefined,
				JANIS_LOCAL: undefined
			});

			await ParameterStore.getSharedParameter('SomeParamDefaultRegion');

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: `arn:aws:ssm:us-east-1:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeParamDefaultRegion`
			}).length, 1);
		});

		it('Should store the parameter in cache and not call SSM on consecutive calls', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				DEVOPS_ACCOUNT_ID: FAKE_DEVOPS_ACCOUNT_ID,
				AWS_REGION: FAKE_REGION,
				JANIS_LOCAL: undefined
			});

			ssmMock.on(GetParameterCommand).resolves({
				Parameter: {
					Name: 'SomeParam4',
					Type: 'String',
					Value: '{"foo":"bar"}',
					Version: 1,
					LastModifiedDate: '2024-10-22T16:57:48.292000-03:00',
					ARN: `arn:aws:ssm:${FAKE_REGION}:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeParam4`,
					DataType: 'text'
				}
			});

			await ParameterStore.getSharedParameter('SomeParam4');
			await ParameterStore.getSharedParameter('SomeParam4');
			await ParameterStore.getSharedParameter('SomeParam4');

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: `arn:aws:ssm:${FAKE_REGION}:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeParam4`
			}).length, 1);
		});

		it('Should reject if the SSM GetParameter call fails', async () => {

			sinon.stub(process, 'env').value({
				...process.env,
				DEVOPS_ACCOUNT_ID: FAKE_DEVOPS_ACCOUNT_ID,
				AWS_REGION: FAKE_REGION,
				JANIS_LOCAL: undefined
			});

			ssmMock.on(GetParameterCommand).rejects(new Error('Parameter does not exist'));

			await assert.rejects(() => ParameterStore.getSharedParameter('SomeParamFailing'));

			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand).length, 1);
			assert.deepStrictEqual(ssmMock.commandCalls(GetParameterCommand, {
				Name: `arn:aws:ssm:${FAKE_REGION}:${FAKE_DEVOPS_ACCOUNT_ID}:parameter/SomeParamFailing`
			}).length, 1);
		});

	});

});
