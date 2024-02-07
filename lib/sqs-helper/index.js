'use strict';

const generateQueueNames = require('./helper/generate-names');

const {
	consumerDefaultsValue,
	mainQueueDefaultsValue,
	dlqQueueDefaultsValue,
	baseArn,
	baseUrl
} = require('./helper/default');
const { defaultTags } = require('../utils/default-tags');

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

	static buildHooks(configs = {}) {

		this.validateConfigs(configs);

		const {
			name,
			consumerProperties,
			mainQueueProperties,
			dlqQueueProperties,
			dlqConsumerProperties
		} = this.getConfigsProperties(configs);

		const {
			titleName,
			sqsName,
			dlqName,
			filename,
			envVarName
		} = generateQueueNames(name);

		return [

			this.getSQSUrlEnvVars(envVarName, sqsName, dlqName),

			this.buildConsumerFunction(titleName, {
				...consumerProperties,
				filename,
				sqsName
			}),

			this.buildQueueResource(sqsName, {
				...mainQueueProperties,
				titleName,
				dlqName
			}),

			this.buildQueueResource(dlqName, {
				...dlqQueueProperties,
				titleName
			}),

			...Object.keys(dlqConsumerProperties).length ? [this.buildConsumerFunction(`${titleName}DLQ`, {
				filename: `${filename}-dlq`,
				timeout: 15,
				...dlqConsumerProperties,
				sqsName: dlqName
			})] : []

		];
	}

	static validateConfigs(configs) {

		if(!configs.name?.length)
			throw new Error('Missing or empty name hook configuration in SQS helper');

		[
			['Main Consumer', configs.consumerProperties],
			['Main Queue', configs.mainQueueProperties],
			['DLQ Consumer', configs.dlqConsumerProperties],
			['DLQ Queue', configs.dlqQueueProperties]
		].forEach(([type, properties]) => {
			if(properties && (typeof properties !== 'object' || Array.isArray(properties)))
				throw new Error(`${type} Properties must be an Object with configuration in SQS helper`);
		});
	}

	static getConfigsProperties(configs) {

		const {
			name,
			dlqConsumerProperties = {}
		} = configs;

		const consumerProperties = {
			...consumerDefaultsValue,
			...configs.consumerProperties
		};
		const mainQueueProperties = {
			...mainQueueDefaultsValue,
			...configs.mainQueueProperties
		};

		const dlqQueueProperties = {
			...dlqQueueDefaultsValue,
			...configs.dlqQueueProperties
		};

		return {
			name,
			consumerProperties,
			mainQueueProperties,
			dlqQueueProperties,
			dlqConsumerProperties
		};
	}

	static getSQSUrlEnvVars(name, sqsName, dlqName) {
		return ['envVars', {
			[`${name}_SQS_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${sqsName}`,
			[`${name}_DLQ_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${dlqName}`
		}];
	}

	static buildConsumerFunction(functionName, {
		filename,
		timeout,
		sqsName,
		handler,
		description,
		functionProperties,
		rawProperties,
		batchSize,
		maximumBatchingWindow,
		eventProperties
	}) {

		return ['function', {
			functionName: `${functionName}QueueConsumer`,
			handler: handler || `src/sqs-consumer/${filename}-consumer.handler`,
			description: description || `${functionName} SQS Queue Consumer`,
			timeout,
			rawProperties: {
				dependsOn: [sqsName],
				...rawProperties
			},
			events: [
				{
					sqs: {
						arn: `${baseArn}:\${self:custom.serviceName}${sqsName}`,
						functionResponseType: 'ReportBatchItemFailures',
						...batchSize && { batchSize },
						...maximumBatchingWindow && { maximumBatchingWindow },
						...eventProperties
					}
				}
			],
			...functionProperties
		}];
	}

	static buildQueueResource(name, {
		titleName,
		maxReceiveCount,
		dlqName,
		receiveMessageWaitTimeSeconds,
		visibilityTimeout,
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
					...dlqName && {
						RedrivePolicy: JSON.stringify({
							maxReceiveCount,
							deadLetterTargetArn: `${baseArn}:\${self:custom.serviceName}${dlqName}`
						})
					},
					...messageRetentionPeriod && { MessageRetentionPeriod: messageRetentionPeriod },
					Tags: [
						...defaultTags,
						{
							Key: 'SQSConstruct',
							Value: titleName
						}
					],
					...extraProperties
				},
				...dlqName && { DependsOn: [dlqName] }
			}
		}];
	}
};
