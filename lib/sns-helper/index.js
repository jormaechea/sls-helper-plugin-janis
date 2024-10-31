'use strict';

const configHelper = require('./helper/config');
const generateArns = require('./helper/generate-arns');
const { upperSnakeCase } = require('../utils/string');

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

	static getEnvVar(topicName) {
		return {
			[`${upperSnakeCase(topicName)}_SNS_TOPIC_ARN`]: generateArns({ name: topicName }).topic
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
	}

	/**
	 * @private
	 */
	static buildTopic() {
		return ['resource', {
			name: `${this.topicProperties.name}Topic`,
			resource: {
				Type: 'AWS::SNS::Topic',
				Properties: {
					TopicName: this.topicProperties.name,
					DisplayName: `\${self:custom.serviceName} ${this.topicProperties.name}`
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
			resource: generateArns({ name: this.topicProperties.name }).topic
		}];
	}

	/**
	 * @private
	 */
	static buildTopicAccessPolicy() {

		const topicArn = generateArns({ name: this.topicProperties.name }).topic;

		return ['resource', {
			name: `${this.topicProperties.name}TopicPolicy`,
			resource: {
				Type: 'Type: AWS::SNS::TopicPolicy',
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
									StringEquals: {
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
