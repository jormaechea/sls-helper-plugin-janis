'use strict';

const generateQueueNames = require('./helper/generate-names');

const {
	consumerDefaultsValue,
	mainQueueDefaultsValue,
	dlqQueueDefaultsValue,
	baseArn
} = require('./helper/default');

module.exports = class SQSHelper {

	static get sqsPermissions() {
		return ['iamStatement', {
			action: [
				'sqs:SendMessage',
				'sqs:DeleteMessage',
				'sqs:ReceiveMessage',
				'sqs:GetQueueAttributes'
			],
			// eslint-disable-next-line no-template-curly-in-string
			resource: `${baseArn}:*`
		}];
	}

	static createSQS({
		name,
		consumerProperties = consumerDefaultsValue,
		mainQueueProperties = mainQueueDefaultsValue,
		dlqConsumerProperties = {},
		dlqQueueProperties = dlqQueueDefaultsValue
	}) {

		const {
			titleName,
			sqsName,
			dlqName
		} = generateQueueNames(name);

		return [

			this.buildConsumerFunction(titleName, {
				...consumerProperties,
				sqsName
			}),

			this.buildSqsResource(sqsName, {
				...mainQueueProperties,
				dlqName
			}),

			this.buildSqsResource(dlqName, dlqQueueProperties),

			...Object.keys(dlqConsumerProperties).length ? [this.buildConsumerFunction(`${titleName}DLQ`, {
				timeout: 15,
				...dlqConsumerProperties,
				sqsName: dlqName
			})] : []

		];
	}

	static buildConsumerFunction(functionName, {
		timeout,
		sqsName,
		handler,
		description,
		functionProperties,
		rawProperties,
		...eventProperties
	}) {

		const fileName = `${functionName[0].toLowerCase()}${functionName.substring(1)}`;

		return ['function', {
			functionName: `${functionName}QueueConsumer`,
			handler: handler || `src/sqs-consumer/${fileName}-consumer.handler`,
			description: description || `${functionName} SQS Queue Consumer`,
			timeout,
			rawProperties: {
				...rawProperties,
				dependsOn: [sqsName]
			},
			events: [
				{
					sqs: {
						arn: `${baseArn}:\${self:custom.serviceName}${sqsName}`,
						...eventProperties
					}
				}
			],
			...functionProperties
		}];
	}

	static buildSqsResource(name, {
		maxReceiveCount,
		dlqName,
		receiveMessageWaitTimeSeconds,
		visibilityTimeout = 60,
		messageRetentionPeriod,
		...extraProperties
	}) {

		const queueName = `\${self:custom.serviceName}${name}`;

		return ['resource', {
			name,
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: queueName,
					ReceiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds,
					VisibilityTimeout: visibilityTimeout,
					// eslint-disable-next-line max-len
					...dlqName && { RedrivePolicy: `{"maxReceiveCount": ${maxReceiveCount}, "deadLetterTargetArn": "${baseArn}:\${self:custom.serviceName}${dlqName}"}` },
					...messageRetentionPeriod && { MessageRetentionPeriod: messageRetentionPeriod },
					...extraProperties
				},
				...dlqName && { DependsOn: [dlqName] }
			}
		}];
	}
};
