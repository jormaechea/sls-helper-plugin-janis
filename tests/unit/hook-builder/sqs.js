'use strict';

const assert = require('assert').strict;

const SQSHelper = require('../../../lib/sqs-helper');

describe('Hook Builder Helpers', () => {

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

				assert.throws(() => SQSHelper.buildHooks(), {
					message: 'Missing or empty name hook configuration in SQS helper'
				});
			});

			it('Should throw if SQS Helper received empty name ', () => {

				assert.throws(() => SQSHelper.buildHooks({ name: '' }), {
					message: 'Missing or empty name hook configuration in SQS helper'
				});
			});

			[
				['Main Consumer', { consumerProperties: 'invalid' }],
				['Main Queue', { mainQueueProperties: 'invalid' }],
				['Delay Consumer', { delayConsumerProperties: 'invalid' }],
				['Delay Queue', { delayQueueProperties: 'invalid' }],
				['DLQ Consumer', { dlqConsumerProperties: 'invalid' }],
				['DLQ Queue', { dlqQueueProperties: 'invalid' }]
			].forEach(([type, data]) => {

				it(`Should throw if SQS Helper received invalid ${type} data`, () => {

					assert.throws(() => SQSHelper.buildHooks({ name: 'test', ...data }), {
						message: `${type} Properties must be an Object with configuration in SQS helper`
					});
				});
			});

			[
				['Main Consumer', { consumerProperties: ['invalid'] }],
				['Main Queue', { mainQueueProperties: ['invalid'] }],
				['Delay Consumer', { delayConsumerProperties: ['invalid'] }],
				['Delay Queue', { delayQueueProperties: ['invalid'] }],
				['DLQ Consumer', { dlqConsumerProperties: ['invalid'] }],
				['DLQ Queue', { dlqQueueProperties: ['invalid'] }]
			].forEach(([type, data]) => {

				it(`Should throw if SQS Helper received an array ${type} data`, () => {

					assert.throws(() => SQSHelper.buildHooks({ name: 'test', ...data }), {
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
						functionResponseType: 'ReportBatchItemFailures',
						batchSize: 10,
						maximumBatchingWindow: 20
					}
				}
			]
		}];

		const queueTags = name => [
			{
				Key: 'Owner',
				Value: 'Janis'
			},
			{
				Key: 'Microservice',
				Value: '${self:custom.serviceName}'
			},
			{
				Key: 'Stack',
				Value: '${param:humanReadableStage}'
			},
			{
				Key: 'SQSConstruct',
				Value: name
			}
		];

		const dlqTags = name => [
			...queueTags(name),
			{
				Key: 'IsDLQ',
				Value: 'true'
			}
		];

		const mainQueueHook = ['resource', {
			name: 'TestQueue',
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: '${self:custom.serviceName}TestQueue',
					ReceiveMessageWaitTimeSeconds: 20,
					VisibilityTimeout: 90,
					// eslint-disable-next-line max-len
					RedrivePolicy: '{"maxReceiveCount":5,"deadLetterTargetArn":"arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ"}',
					Tags: queueTags('Test')
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
					ReceiveMessageWaitTimeSeconds: 20,
					VisibilityTimeout: 90,
					MessageRetentionPeriod: 864000,
					Tags: dlqTags('Test')
				}
			}
		}];

		const sqsUrlEnvVarsHook = ['envVars', {
			TEST_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestQueue',
			TEST_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestDLQ'
		}];

		context('Create basic SQS Hooks', () => {

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using only a name', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({ name: 'Test' }), [
					sqsUrlEnvVarsHook,
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using only a name in LowerCase', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({ name: 'test' }), [
					sqsUrlEnvVarsHook,
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and both consumers for main queue using a name and some config for dlq consumer', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({ name: 'Test', dlqConsumerProperties: { batchSize: 10 } }), [
					sqsUrlEnvVarsHook,
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook,
					['function', {
						functionName: 'TestDLQQueueConsumer',
						handler: 'src/sqs-consumer/test-dlq-consumer.handler',
						description: 'TestDLQ SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['TestDLQ']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ',
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 10
								}
							}
						]
					}]
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using only a name in camelCase', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({ name: 'TestBegin', dlqConsumerProperties: { batchSize: 10 } }), [
					['envVars', {
						TEST_BEGIN_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestBeginQueue',
						TEST_BEGIN_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestBeginDLQ'
					}],
					['function', {
						functionName: 'TestBeginQueueConsumer',
						handler: 'src/sqs-consumer/test-begin-consumer.handler',
						description: 'TestBegin SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['TestBeginQueue']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestBeginQueue',
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 10,
									maximumBatchingWindow: 20
								}
							}
						]
					}],
					['resource', {
						name: 'TestBeginQueue',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}TestBeginQueue',
								ReceiveMessageWaitTimeSeconds: 20,
								VisibilityTimeout: 90,
								// eslint-disable-next-line max-len
								RedrivePolicy: '{"maxReceiveCount":5,"deadLetterTargetArn":"arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestBeginDLQ"}',
								Tags: queueTags('TestBegin')
							},
							DependsOn: ['TestBeginDLQ']
						}
					}],
					['resource', {
						name: 'TestBeginDLQ',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}TestBeginDLQ',
								ReceiveMessageWaitTimeSeconds: 20,
								VisibilityTimeout: 90,
								MessageRetentionPeriod: 864000,
								Tags: dlqTags('TestBegin')
							}
						}
					}],
					['function', {
						functionName: 'TestBeginDLQQueueConsumer',
						handler: 'src/sqs-consumer/test-begin-dlq-consumer.handler',
						description: 'TestBeginDLQ SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['TestBeginDLQ']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestBeginDLQ',
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 10
								}
							}
						]
					}]
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ and consumer used for both Queues', () => {

				const mainConsumerForBothQueuesFunctionHook = JSON.parse(JSON.stringify(mainConsumerFunctionHook));

				mainConsumerForBothQueuesFunctionHook[1].events.push({
					sqs: {
						arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ',
						functionResponseType: 'ReportBatchItemFailures',
						batchSize: 50,
						maximumBatchingWindow: 30
					}
				});

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					dlqConsumerProperties: { useMainHandler: true, batchSize: 50, maximumBatchingWindow: 30 }
				}), [
					sqsUrlEnvVarsHook,
					mainConsumerForBothQueuesFunctionHook,
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ and add custom tags for Queues when using addTags field', () => {

				const mainQueueHookTags = JSON.parse(JSON.stringify(mainQueueHook));
				mainQueueHookTags[1].resource.Properties.Tags = [...mainQueueHookTags[1].resource.Properties.Tags, { Key: 'isCritical', Value: true }];

				const dlqQueueHookTags = JSON.parse(JSON.stringify(dlqQueueHook));
				dlqQueueHookTags[1].resource.Properties.Tags = [...dlqQueueHookTags[1].resource.Properties.Tags, { Key: 'isCritical', Value: true }];

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					mainQueueProperties: {
						addTags: [{ Key: 'isCritical', Value: true }]
					},
					dlqQueueProperties: {
						addTags: [{ Key: 'isCritical', Value: true }]
					}
				}), [
					sqsUrlEnvVarsHook,
					mainConsumerFunctionHook,
					mainQueueHookTags,
					dlqQueueHookTags
				]);
			});
		});

		context('Create SQS Hooks with Custom Consumer configuration', () => {

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom main consumer properties', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					consumerProperties: {
						timeout: 30,
						batchSize: 20,
						maximumBatchingWindow: 80
					}
				}), [
					sqsUrlEnvVarsHook,
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
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 20,
									maximumBatchingWindow: 80
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and both consumers for main queue using custom dlq consumer properties', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					dlqConsumerProperties: {
						timeout: 30,
						batchSize: 20,
						maximumBatchingWindow: 80
					}
				}), [
					sqsUrlEnvVarsHook,
					mainConsumerFunctionHook,
					mainQueueHook,
					dlqQueueHook,
					['function', {
						functionName: 'TestDLQQueueConsumer',
						handler: 'src/sqs-consumer/test-dlq-consumer.handler',
						description: 'TestDLQ SQS Queue Consumer',
						timeout: 30,
						rawProperties: {
							dependsOn: ['TestDLQ']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ',
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 20,
									maximumBatchingWindow: 80
								}
							}
						]
					}]
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom consumer handler and description', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					consumerProperties: {
						handler: 'src/sqs-listener/test.handler',
						description: 'SQS Listener'
					}
				}), [
					sqsUrlEnvVarsHook,
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
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 10,
									maximumBatchingWindow: 20
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom consumer sqs events properties', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					consumerProperties: {
						eventProperties: {
							functionResponseType: null
						}
					}
				}), [
					sqsUrlEnvVarsHook,
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
									batchSize: 10,
									maximumBatchingWindow: 20,
									functionResponseType: null
								}
							}
						]
					}],
					mainQueueHook,
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom consumer function and changed raw properties', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
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
					sqsUrlEnvVarsHook,
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
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 10,
									maximumBatchingWindow: 20
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

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					mainQueueProperties: {
						maxReceiveCount: 1,
						receiveMessageWaitTimeSeconds: 10,
						visibilityTimeout: 50
					}
				}), [
					sqsUrlEnvVarsHook,
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
								RedrivePolicy: '{"maxReceiveCount":1,"deadLetterTargetArn":"arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ"}',
								Tags: queueTags('Test')
							},
							DependsOn: ['TestDLQ']
						}
					}],
					dlqQueueHook
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom dlq queue properties', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					dlqQueueProperties: {
						receiveMessageWaitTimeSeconds: 10,
						visibilityTimeout: 50,
						messageRetentionPeriod: 432000
					}
				}), [
					sqsUrlEnvVarsHook,
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
								MessageRetentionPeriod: 432000,
								Tags: dlqTags('Test')
							}
						}
					}]
				]);
			});

			it('Should create an SQS Hook for Main Queue, DLQ, and consumer for main queue using custom queue extra properties', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					mainQueueProperties: {
						extraProp: true
					}
				}), [
					sqsUrlEnvVarsHook,
					mainConsumerFunctionHook,
					['resource', {
						name: 'TestQueue',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}TestQueue',
								ReceiveMessageWaitTimeSeconds: 20,
								VisibilityTimeout: 90,
								// eslint-disable-next-line max-len
								RedrivePolicy: '{"maxReceiveCount":5,"deadLetterTargetArn":"arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ"}',
								Tags: queueTags('Test'),
								extraProp: true
							},
							DependsOn: ['TestDLQ']
						}
					}],
					dlqQueueHook
				]);
			});
		});

		context('Create FIFO SQS', () => {

			it('Should create SQS hook for Main Queue, DLQ, and consumers', () => {

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'MyFifo',
					mainQueueProperties: {
						fifoQueue: true,
						fifoThroughputLimit: 'perMessageGroupId',
						deduplicationScope: 'messageGroup',
						contentBasedDeduplication: true
					},
					consumerProperties: { prefixPath: 'my-custom-path' },
					dlqConsumerProperties: { prefixPath: 'my-custom-path' }
				}), [

					['envVars', {
						MY_FIFO_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}MyFifoQueue.fifo',
						MY_FIFO_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}MyFifoDLQ.fifo'
					}],

					['function', {
						functionName: 'MyFifoQueueConsumer',
						handler: 'src/sqs-consumer/my-custom-path/my-fifo-consumer.handler',
						description: 'MyFifo SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['MyFifoQueue']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}MyFifoQueue.fifo',
									functionResponseType: 'ReportBatchItemFailures',
									batchSize: 10,
									maximumBatchingWindow: 20
								}
							}
						]
					}],

					['resource', {
						name: 'MyFifoQueue',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}MyFifoQueue.fifo',
								ReceiveMessageWaitTimeSeconds: 20,
								VisibilityTimeout: 90,
								// eslint-disable-next-line max-len
								RedrivePolicy: JSON.stringify({
									maxReceiveCount: 5,
									deadLetterTargetArn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}MyFifoDLQ.fifo'
								}),
								FifoQueue: true,
								FifoThroughputLimit: 'perMessageGroupId',
								DeduplicationScope: 'messageGroup',
								ContentBasedDeduplication: true,
								Tags: queueTags('MyFifo')
							},
							DependsOn: ['MyFifoDLQ']
						}
					}],

					['resource', {
						name: 'MyFifoDLQ',
						resource: {
							Type: 'AWS::SQS::Queue',
							Properties: {
								QueueName: '${self:custom.serviceName}MyFifoDLQ.fifo',
								ReceiveMessageWaitTimeSeconds: 20,
								VisibilityTimeout: 90,
								MessageRetentionPeriod: 864000,
								FifoQueue: true,
								Tags: dlqTags('MyFifo')
							}
						}
					}],

					['function', {
						functionName: 'MyFifoDLQQueueConsumer',
						handler: 'src/sqs-consumer/my-custom-path/my-fifo-dlq-consumer.handler',
						description: 'MyFifoDLQ SQS Queue Consumer',
						timeout: 15,
						rawProperties: {
							dependsOn: ['MyFifoDLQ']
						},
						events: [
							{
								sqs: {
									arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}MyFifoDLQ.fifo',
									functionResponseType: 'ReportBatchItemFailures'
								}
							}
						]
					}]
				]);

			});
		});

		context('Create SQS Hooks with Delay Queue', () => {

			const envVarsHook = ['envVars', {
				TEST_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestQueue',
				TEST_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestDLQ',
				TEST_DELAY_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}TestDelayQueue'
			}];

			const delayQueueTags = name => [
				...queueTags(name),
				{
					Key: 'DelayQueue',
					Value: 'true'
				}
			];

			const delayQueueHook = ['resource', {
				name: 'TestDelayQueue',
				resource: {
					Type: 'AWS::SQS::Queue',
					Properties: {
						QueueName: '${self:custom.serviceName}TestDelayQueue',
						ReceiveMessageWaitTimeSeconds: 20,
						VisibilityTimeout: 600,
						DelaySeconds: 300, // default values DelaySeconds
						RedrivePolicy: JSON.stringify({
							maxReceiveCount: 5,
							deadLetterTargetArn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDLQ'
						}),
						Tags: delayQueueTags('Test')
					},
					DependsOn: ['TestDLQ']
				}
			}];

			it('Should create SQS hook for Main Queue, DelayQueue, DLQ, using default consumers', () => {

				const mainQueueHookPointingDelayQueue = JSON.parse(JSON.stringify(mainQueueHook));

				mainQueueHookPointingDelayQueue[1].resource.Properties.RedrivePolicy = JSON.stringify({
					maxReceiveCount: 5,
					deadLetterTargetArn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDelayQueue'
				});

				mainQueueHookPointingDelayQueue[1].resource.DependsOn = ['TestDelayQueue'];

				const delayConsumerFunctionHook = ['function', {
					functionName: 'TestDelayQueueConsumer',
					handler: 'src/sqs-consumer/test-delay-consumer.handler',
					description: 'TestDelay SQS Queue Consumer',
					timeout: 15,
					rawProperties: {
						dependsOn: ['TestDelayQueue']
					},
					events: [{
						sqs: {
							arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDelayQueue',
							functionResponseType: 'ReportBatchItemFailures',
							batchSize: 10,
							maximumBatchingWindow: 20
						}
					}]
				}];

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					delayQueueProperties: { visibilityTimeout: 600 }
					// default consumer (with main consumer config)
				}), [
					envVarsHook,
					mainConsumerFunctionHook,
					mainQueueHookPointingDelayQueue,
					delayConsumerFunctionHook,
					delayQueueHook,
					dlqQueueHook
				]);

			});

			it('Should create SQS hook for Main Queue, DelayQueue, DLQ, using main consumer for delay queue', () => {

				const mainQueueHookPointingDelayQueue = JSON.parse(JSON.stringify(mainQueueHook));

				mainQueueHookPointingDelayQueue[1].resource.Properties.RedrivePolicy = JSON.stringify({
					maxReceiveCount: 5,
					deadLetterTargetArn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDelayQueue'
				});

				mainQueueHookPointingDelayQueue[1].resource.DependsOn = ['TestDelayQueue'];

				const mainConsumerForBothQueuesFunctionHook = JSON.parse(JSON.stringify(mainConsumerFunctionHook));

				mainConsumerForBothQueuesFunctionHook[1].events.push({
					sqs: {
						arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}TestDelayQueue',
						functionResponseType: 'ReportBatchItemFailures',
						batchSize: 50,
						maximumBatchingWindow: 30
					}
				});

				const customDelayQueueHook = JSON.parse(JSON.stringify(delayQueueHook));

				customDelayQueueHook[1].resource.Properties.DelaySeconds = 60; // custom DelaySeconds

				assert.deepStrictEqual(SQSHelper.buildHooks({
					name: 'Test',
					delayQueueProperties: {
						visibilityTimeout: 600,
						delaySeconds: 60 // custom DelaySeconds
					},
					delayConsumerProperties: {
						useMainHandler: true, // should use main consumer not creating another function
						batchSize: 50,
						maximumBatchingWindow: 30
					}
				}), [
					envVarsHook,
					mainConsumerForBothQueuesFunctionHook,
					mainQueueHookPointingDelayQueue,
					customDelayQueueHook,
					dlqQueueHook
				]);

			});
		});
	});
});
