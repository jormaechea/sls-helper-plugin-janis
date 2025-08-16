'use strict';

const configHelper = require('./helper/config');
const generateArns = require('./helper/generate-arns');
const generateNames = require('./helper/generate-names');
const fixFifoName = require('./helper/fix-fifo-name');

module.exports = class SNSHelper {

	/**
	 * @param {import('./types/config').SNSConfig} config
	 * @returns {Array} An array of SLS Helper hooks
	 */
	static buildHooks(config = {}) {

		this.validateConfigs(config);

		this.setConfigsWithDefaults(config);

		return [

			// Topic definition
			this.buildTopic(),

			// Topic publish permissions
			this.buildTopicPermissions(),

			this.buildTopicAccessPolicy()

		];
	}

	static getEnvVar(topicName, fifoTopic) {

		const { envVarName } = generateNames(topicName);

		return {
			[`${envVarName}_SNS_TOPIC_ARN`]: generateArns({ name: topicName, fifoTopic }).topic
		};
	}

	/**
	 * @param {import('./types/config').SNSConfig} config
	 * @private
	 */
	static validateConfigs(config) {
		configHelper.validate(config);
	}

	/**
	 * @param {import('./types/config').SNSConfig} userConfig
	 * @private
	 */
	static setConfigsWithDefaults(userConfig) {
		/** @private */
		this.topicProperties = userConfig.topic;
		this.fifoTopic = !!this.topicProperties.fifoTopic;
		this.names = generateNames(this.topicProperties.name);
		this.arns = generateArns({ name: this.topicProperties.name, fifoTopic: this.fifoTopic });
	}

	/**
	 * @private
	 */
	static buildTopic() {

		const { name, contentBasedDeduplication } = this.topicProperties;

		return ['resource', {
			name: this.names.topic,
			resource: {
				Type: 'AWS::SNS::Topic',
				Properties: {
					TopicName: fixFifoName(name, this.fifoTopic),
					DisplayName: `\${self:custom.serviceName} ${name}`,
					...this.fifoTopic && {
						FifoTopic: true,
						...contentBasedDeduplication && { ContentBasedDeduplication: true }
					}
				}
			}
		}];
	}

	/**
	 * @private
	 */
	static buildTopicPermissions() {
		return ['iamStatement', {
			action: [
				'sns:Publish'
			],
			resource: this.arns.topic
		}];
	}

	/**
	 * @private
	 */
	static buildTopicAccessPolicy() {

		const topicArn = this.arns.topic;

		return ['resource', {
			name: this.names.topicPolicy,
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
								Resource: topicArn,
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
								Resource: topicArn,
								Condition: {
									'ForAnyValue:StringLike': {
										'aws:PrincipalOrgPaths': '${env:AWS_ORGANIZATIONAL_UNIT_PATH}'
									}
								}
							}
						]
					},
					Topics: [topicArn]
				}
			}
		}];
	}

};
