'use strict';

const configHelper = require('./helper/config');
const generateArns = require('./helper/generate-arns');
const { upperSnakeCase } = require('../utils/string');

module.exports = class SNSHelper {

	static buildHooks(configs = {}) {

		this.validateConfigs(configs);

		this.setConfigsWithDefaults(configs);

		return [

			// Topic definition
			this.buildTopic(),

			// Topic publish permissions
			this.buildTopicPermissions(),

			// Topic env var for publishing events
			this.buildTopicEnvVar()

		];
	}

	static validateConfigs(configs) {
		configHelper.validate(configs);
	}

	static setConfigsWithDefaults(userConfigs) {
		this.topicProperties = userConfigs.topic;
	}

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

	static buildTopicPermissions() {
		return ['iamStatement', {
			action: [
				'sns:Publish'
			],
			resource: generateArns(this.topicProperties.name).topic
		}];
	}

	static buildTopicEnvVar() {
		return ['envVars', {
			[`${upperSnakeCase(this.topicProperties.name)}_SNS_TOPIC_ARN`]: generateArns(this.topicProperties.name).topic
		}];
	}

};
