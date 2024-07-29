'use strict';

const generateQueueNames = require('./helper/generate-names');

const {
	consumerDefaultsValue,
	mainQueueDefaultsValue,
	dlqConsumerDefaultsValue,
	dlqQueueDefaultsValue,
	baseArn,
	baseUrl
} = require('./helper/default');

const { defaultTags } = require('../utils/default-tags');
const addFifoSuffix = require('./helper/add-fifo-suffix');
const generateArns = require('./helper/generate-arns');

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

		const fifoQueue = !!mainQueueProperties.fifoQueue;

		const {
			titleName,
			sqsName,
			dlqName,
			filename,
			envVarName
		} = generateQueueNames(name);

		const {
			sqsArn, dlqArn
		} = generateArns(sqsName, dlqName, fifoQueue);

		return [

			this.getSQSUrlEnvVars(envVarName, sqsName, dlqName, fifoQueue),

			this.buildConsumerFunction(titleName, {
				...consumerProperties,
				filename,
				queueName: sqsName,
				queueArn: sqsArn,
				fifoQueue
			}),

			this.buildQueueResource(sqsName, {
				...mainQueueProperties,
				titleName,
				dlqName,
				dlqArn,
				fifoQueue
			}),

			this.buildQueueResource(dlqName, {
				...dlqQueueProperties,
				titleName,
				isDLQ: true,
				fifoQueue
			}),

			...configs.dlqConsumerProperties && Object.keys(configs.dlqConsumerProperties).length
				? [this.buildConsumerFunction(titleName, {
					...dlqConsumerProperties,
					filename,
					queueName: dlqName,
					queueArn: dlqArn,
					isDLQ: true,
					fifoQueue
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

		const consumerProperties = {
			...consumerDefaultsValue,
			...configs.consumerProperties
		};

		const mainQueueProperties = {
			...mainQueueDefaultsValue,
			...configs.mainQueueProperties
		};

		const dlqConsumerProperties = {
			...dlqConsumerDefaultsValue,
			...configs.dlqConsumerProperties
		};

		const dlqQueueProperties = {
			...dlqQueueDefaultsValue,
			...configs.dlqQueueProperties
		};

		return {
			name: configs.name,
			consumerProperties,
			mainQueueProperties,
			dlqQueueProperties,
			dlqConsumerProperties
		};
	}

	static getSQSUrlEnvVars(name, sqsName, dlqName, fifoQueue) {
		return ['envVars', {
			[`${name}_SQS_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(sqsName) : sqsName}`,
			[`${name}_DLQ_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(dlqName) : dlqName}`
		}];
	}

	static buildConsumerFunction(functionName, {
		isDLQ,
		prefixPath,
		filename,
		handler,
		timeout,
		queueName,
		queueArn,
		description,
		functionProperties,
		rawProperties,
		batchSize,
		maximumBatchingWindow,
		eventProperties
	}) {

		if(isDLQ) {
			functionName = `${functionName}DLQ`;
			filename = `${filename}-dlq`;
		}

		if(prefixPath)
			filename = `${prefixPath}/${filename}`;

		return ['function', {
			functionName: `${functionName}QueueConsumer`,
			handler: handler || `src/sqs-consumer/${filename}-consumer.handler`,
			description: description || `${functionName} SQS Queue Consumer`,
			timeout,
			rawProperties: {
				dependsOn: [queueName],
				...rawProperties
			},
			events: [
				{
					sqs: {
						arn: queueArn,
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
		isDLQ,
		titleName,
		maxReceiveCount,
		dlqName,
		dlqArn,
		receiveMessageWaitTimeSeconds,
		visibilityTimeout,
		messageRetentionPeriod,
		fifoQueue,
		fifoThroughputLimit,
		contentBasedDeduplication,
		deduplicationScope,
		...extraProperties
	}) {

		return ['resource', {
			name,
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: `\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(name) : name}`,
					ReceiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds,
					VisibilityTimeout: visibilityTimeout,
					// eslint-disable-next-line max-len
					...dlqName && {
						RedrivePolicy: JSON.stringify({
							maxReceiveCount,
							deadLetterTargetArn: dlqArn
						})
					},
					...messageRetentionPeriod && { MessageRetentionPeriod: messageRetentionPeriod },
					...fifoQueue && { FifoQueue: true },
					...fifoQueue && fifoThroughputLimit && { FifoThroughputLimit: fifoThroughputLimit },
					...fifoQueue && deduplicationScope && { DeduplicationScope: deduplicationScope },
					...fifoQueue && contentBasedDeduplication && { ContentBasedDeduplication: true },
					Tags: [
						...defaultTags,
						{ Key: 'SQSConstruct', Value: titleName },
						...isDLQ ? [{ Key: 'IsDLQ', Value: 'true' }] : []
					],
					...extraProperties
				},
				...dlqName && { DependsOn: [dlqName] }
			}
		}];
	}
};
