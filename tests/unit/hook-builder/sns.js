'use strict';

const assert = require('assert').strict;

const SNSHelper = require('../../../lib/sns-helper');

describe('Hook Builder Helpers', () => {

	describe('SNS', () => {

		// Helper functions to generate test constants
		const generateTopicName = (isFifo = false) => {
			return isFifo ? 'somethingHappened.fifo' : 'somethingHappened';
		};

		const generateTopicARN = (isFifo = false) => {
			return `arn:aws:sns:\${aws:region}:\${aws:accountId}:${generateTopicName(isFifo)}`;
		};

		const generateTopicHook = (isFifo = false) => ['resource', {
			name: 'somethingHappenedTopic',
			resource: {
				Type: 'AWS::SNS::Topic',
				Properties: {
					TopicName: generateTopicName(isFifo),
					DisplayName: '${self:custom.serviceName} somethingHappened',
					...(isFifo && { FifoTopic: true })
				}
			}
		}];

		const generateTopicWithDeduplicationHook = (isFifo = false) => ['resource', {
			name: 'somethingHappenedTopic',
			resource: {
				Type: 'AWS::SNS::Topic',
				Properties: {
					TopicName: generateTopicName(isFifo),
					DisplayName: '${self:custom.serviceName} somethingHappened',
					...(isFifo && { FifoTopic: true }),
					...(isFifo && { ContentBasedDeduplication: true })
				}
			}
		}];

		const generateTopicPermissionsHook = (isFifo = false) => ['iamStatement', {
			action: [
				'sns:Publish'
			],
			resource: generateTopicARN(isFifo)
		}];

		const generateTopicPermissionsPolicy = (isFifo = false) => ['resource', {
			name: 'somethingHappenedTopicPolicy',
			resource: {
				Type: 'AWS::SNS::TopicPolicy',
				Properties: {
					PolicyDocument: {
						Version: '2008-10-17',
						Id: 'TopicPolicy',
						Statement: [
							{
								Sid: 'defaultStatement',
								Effect: 'Allow',
								Principal: {
									AWS: '*'
								},
								Action: [
									'SNS:GetTopicAttributes',
									'SNS:SetTopicAttributes',
									'SNS:AddPermission',
									'SNS:RemovePermission',
									'SNS:DeleteTopic',
									'SNS:Subscribe',
									'SNS:ListSubscriptionsByTopic',
									'SNS:Publish'
								],
								Resource: generateTopicARN(isFifo),
								Condition: {
									StringEquals: {
										'AWS:SourceOwner': '${aws:accountId}'
									}
								}
							},
							{
								Sid: 'organizationSubscribe',
								Effect: 'Allow',
								Principal: {
									AWS: '*'
								},
								Action: 'SNS:Subscribe',
								Resource: generateTopicARN(isFifo),
								Condition: {
									'ForAnyValue:StringLike': {
										'aws:PrincipalOrgPaths': '${env:AWS_ORGANIZATIONAL_UNIT_PATH}'
									}
								}
							}
						]
					},
					Topics: [generateTopicARN(isFifo)]
				}
			}
		}];

		const generateEnvVar = (isFifo = false) => ({
			SOMETHING_HAPPENED_SNS_TOPIC_ARN: generateTopicARN(isFifo)
		});

		context('SNS properties validations', () => {

			it('Should throw if SNS Helper does not receive topic configs', () => {
				assert.throws(() => SNSHelper.buildHooks(), {
					message: 'SNS config validation error: The \'topic\' field is required.'
				});
			});

			it('Should throw if SNS Helper does not receive topic.name', () => {
				assert.throws(() => SNSHelper.buildHooks({ topic: {} }), {
					message: 'SNS config validation error: The \'topic.name\' field is required.'
				});
			});

			it('Should throw if SNS Helper receives a non-string topic.name', () => {
				assert.throws(() => SNSHelper.buildHooks({
					topic: {
						name: true
					}
				}), {
					message: 'SNS config validation error: The \'topic.name\' field must be a string.'
				});
			});

			it('Should throw if SNS Helper receives topic.name as an empty string', () => {
				assert.throws(() => SNSHelper.buildHooks({
					topic: {
						name: ''
					}
				}), {
					message: 'SNS config validation error: The \'topic.name\' field must not be empty.'
				});
			});

			it('Should throw if SNS Helper receives topic.name is longer than 256 characters', () => {
				assert.throws(() => SNSHelper.buildHooks({
					topic: {
						name: 'a'.repeat(257)
					}
				}), {
					message: 'SNS config validation error: The \'topic.name\' field length must be less than or equal to 256 characters long.'
				});
			});

			it('Should throw if SNS Helper receives topic.name with special characters', () => {
				assert.throws(() => SNSHelper.buildHooks({
					topic: {
						name: 'MyTopic!'
					}
				}), {
					message: 'SNS config validation error: The \'topic.name\' field fails to match the required pattern.'
				});
			});
		});

		context('Create basic SNS Topic', () => {

			it('Should create a SNS Topic, service permissions and an ENV VAR with the topic ARN', () => {

				assert.deepStrictEqual(SNSHelper.buildHooks({
					topic: {
						name: 'somethingHappened'
					}
				}), [
					generateTopicHook(false),
					generateTopicPermissionsHook(false),
					generateTopicPermissionsPolicy(false)
				]);
			});

		});

		context('Create SNS FIFO Topic', () => {

			it('Should create a SNS FIFO Topic with basic FIFO properties', () => {

				assert.deepStrictEqual(SNSHelper.buildHooks({
					topic: {
						name: 'somethingHappened',
						fifoTopic: true
					}
				}), [
					generateTopicHook(true),
					generateTopicPermissionsHook(true),
					generateTopicPermissionsPolicy(true)
				]);
			});

			it('Should create a SNS FIFO Topic with content-based deduplication', () => {

				assert.deepStrictEqual(SNSHelper.buildHooks({
					topic: {
						name: 'somethingHappened',
						fifoTopic: true,
						contentBasedDeduplication: true
					}
				}), [
					generateTopicWithDeduplicationHook(true),
					generateTopicPermissionsHook(true),
					generateTopicPermissionsPolicy(true)
				]);
			});

		});

		context('Environment variable', () => {

			it('Should return the Env var object based on the topic name', () => {

				const result = SNSHelper.getEnvVar('somethingHappened');

				assert.deepStrictEqual(result, generateEnvVar(false));
			});

			it('Should return the Env var object for FIFO topic with correct ARN', () => {

				const result = SNSHelper.getEnvVar('somethingHappened', true);

				assert.deepStrictEqual(result, generateEnvVar(true));
			});
		});
	});
});
