'use strict';

const assert = require('assert').strict;

const SQSHelper = require('../../../lib/sqs-helper');

describe('Build Hook Helpers', () => {

	describe('SQS', () => {

		context('Get Permission\'s Hook', () => {

			it('Should return the Permission Hook', () => {

				assert.deepStrictEqual(SQSHelper.sqsPermissions, ['iamStatement', {
					action: [
						'sqs:SendMessage',
						'sqs:DeleteMessage',
						'sqs:ReceiveMessage',
						'sqs:GetQueueAttributes'
					],
					// eslint-disable-next-line no-template-curly-in-string
					resource: 'arn:aws:sqs:${aws:region}:${aws:accountId}:*'
				}]);
			});
		});

		context('SQS properties validations', () => {

			it('Should throw if SQS Helper not received name', () => {

				assert.throws(() => SQSHelper.createSQS(), {
					message: 'Missing or empty name hook configuration in SQS helper'
				});
			});

			it('Should throw if SQS Helper received empty name ', () => {

				assert.throws(() => SQSHelper.createSQS({ name: '' }), {
					message: 'Missing or empty name hook configuration in SQS helper'
				});
			});

			[
				['Main Consumer', { consumerProperties: 'invalid' }],
				['Main Queue', { mainQueueProperties: 'invalid' }],
				['DLQ Consumer', { dlqConsumerProperties: 'invalid' }],
				['DLQ Queue', { dlqQueueProperties: 'invalid' }]
			].forEach(([type, data]) => {

				it(`Should throw if SQS Helper received invalid ${type} data`, () => {

					assert.throws(() => SQSHelper.createSQS({ name: 'test', ...data }), {
						message: `${type} Properties must be an Object with configuration in SQS helper`
					});
				});
			});

			[
				['Main Consumer', { consumerProperties: ['invalid'] }],
				['Main Queue', { mainQueueProperties: ['invalid'] }],
				['DLQ Consumer', { dlqConsumerProperties: ['invalid'] }],
				['DLQ Queue', { dlqQueueProperties: ['invalid'] }]
			].forEach(([type, data]) => {

				it(`Should throw if SQS Helper received an array ${type} data`, () => {

					assert.throws(() => SQSHelper.createSQS({ name: 'test', ...data }), {
						message: `${type} Properties must be an Object with configuration in SQS helper`
					});
				});
			});

		});

		const mainConsumerFunctionHook = ['function', {
			functionName: 'TestQueueConsumer',
			handler: 'src/sqs-consumer/test-consumer.handler',
			description: 'Test SQS Queue Consumer',
			timeout: 15,
			rawProperties: {
				dependsOn: ['TestQueue']
			},
			events: [
				{
					sqs: {
						arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestQueue',
						batchSize: 1,
						maximumBatchingWindow: 10
					}
				}
			]
		}];

		const mainQueueHook = ['resource', {
			name: 'TestQueue',
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: '${self:custom.serviceName}TestQueue',
					ReceiveMessageWaitTimeSeconds: 20,
					VisibilityTimeout: 60,
					// eslint-disable-next-line max-len
					RedrivePolicy: '{"maxReceiveCount": 5, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ"}'
				},
				DependsOn: ['TestDLQ']
			}
		}];

		const dlqQueueHook = ['resource', {
			name: 'TestDLQ',
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: '${self:custom.serviceName}TestDLQ',
					ReceiveMessageWaitTimeSeconds: 5,
					VisibilityTimeout: 20,
					MessageRetentionPeriod: 864000
				}
			}
		}];

		context('Create basic SQS Hooks', () => {

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using only a name', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({ name: 'Test' }), [
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using only a name in LowerCase', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({ name: 'test' }), [
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and both consumers for main queue using a name and some config for dlq consumer', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({ name: 'Test', dlqConsumerProperties: { batchSize: 1 } }), [
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook,
					['function', {
						functionName: 'TestDLQQueueConsumer',
						handler: 'src/sqs-consumer/testDLQ-consumer.handler',
						description: 'TestDLQ SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['TestDLQ']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ',
									batchSize: 1
								}
							}
						]
					}]
				]);
			});

		});

		context('Create SQS Hooks with Custom Consumer configuration', () => {

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom main consumer properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					consumerProperties: {
						timeout: 30,
						batchSize: 10,
						maximumBatchingWindow: 100
					}
				}), [
					['function', {
						functionName: 'TestQueueConsumer',
						handler: 'src/sqs-consumer/test-consumer.handler',
						description: 'Test SQS Queue Consumer',
						timeout: 30,
						rawProperties: {
							dependsOn: ['TestQueue']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestQueue',
									batchSize: 10,
									maximumBatchingWindow: 100
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and both consumers for main queue using custom dlq consumer properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					dlqConsumerProperties: {
						timeout: 30,
						batchSize: 10,
						maximumBatchingWindow: 100
					}
				}), [
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook,
					['function', {
						functionName: 'TestDLQQueueConsumer',
						handler: 'src/sqs-consumer/testDLQ-consumer.handler',
						description: 'TestDLQ SQS Queue Consumer',
						timeout: 30,
						rawProperties: {
							dependsOn: ['TestDLQ']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ',
									batchSize: 10,
									maximumBatchingWindow: 100
								}
							}
						]
					}]
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom consumer handler and description', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					consumerProperties: {
						handler: 'src/sqs-listener/test.handler',
						description: 'SQS Listener'
					}
				}), [
					['function', {
						functionName: 'TestQueueConsumer',
						handler: 'src/sqs-listener/test.handler',
						description: 'SQS Listener',
						timeout: 15,
						rawProperties: {
							dependsOn: ['TestQueue']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestQueue',
									batchSize: 1,
									maximumBatchingWindow: 10
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom consumer sqs events properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					consumerProperties: {
						functionResponseType: 'ReportBatchFailures'
					}
				}), [
					['function', {
						functionName: 'TestQueueConsumer',
						handler: 'src/sqs-consumer/test-consumer.handler',
						description: 'Test SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['TestQueue']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestQueue',
									batchSize: 1,
									maximumBatchingWindow: 10,
									functionResponseType: 'ReportBatchFailures'
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom consumer function and changed raw properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					consumerProperties: {
						functionProperties: {
							memorySize: 2048
						},
						rawProperties: {
							dependsOn: ['TestQueue', 'SecretFunction']
						}
					}
				}), [
					['function', {
						functionName: 'TestQueueConsumer',
						handler: 'src/sqs-consumer/test-consumer.handler',
						description: 'Test SQS Queue Consumer',
						timeout: 15,
						memorySize: 2048,
						rawProperties: {
							dependsOn: ['TestQueue', 'SecretFunction']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestQueue',
									batchSize: 1,
									maximumBatchingWindow: 10
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});
		});

		context('Create SQS Hooks with Custom Queue configuration', () => {

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom main queue properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					mainQueueProperties: {
						maxReceiveCount: 1,
						receiveMessageWaitTimeSeconds: 10,
						visibilityTimeout: 50
					}
				}), [
					mainConsumerFunctionHook,
					['resource', {
						name: 'TestQueue',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}TestQueue',
								ReceiveMessageWaitTimeSeconds: 10,
								VisibilityTimeout: 50,
								// eslint-disable-next-line max-len
								RedrivePolicy: '{"maxReceiveCount": 1, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ"}'
							},
							DependsOn: ['TestDLQ']
						}
					}],
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom dlq queue properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					dlqQueueProperties: {
						receiveMessageWaitTimeSeconds: 10,
						visibilityTimeout: 50,
						messageRetentionPeriod: 432000
					}
				}), [
					mainConsumerFunctionHook,
					mainQueueHook,
					['resource', {
						name: 'TestDLQ',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}TestDLQ',
								ReceiveMessageWaitTimeSeconds: 10,
								VisibilityTimeout: 50,
								MessageRetentionPeriod: 432000
							}
						}
					}]
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom queue extra properties', () => {

				assert.deepStrictEqual(SQSHelper.createSQS({
					name: 'Test',
					mainQueueProperties: {
						extraProp: true
					}
				}), [
					mainConsumerFunctionHook,
					['resource', {
						name: 'TestQueue',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}TestQueue',
								ReceiveMessageWaitTimeSeconds: 20,
								VisibilityTimeout: 60,
								// eslint-disable-next-line max-len
								RedrivePolicy: '{"maxReceiveCount": 5, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ"}',
								extraProp: true
							},
							DependsOn: ['TestDLQ']
						}
					}],
					dlqQueueHook
				]);
			});
		});
	});
});
