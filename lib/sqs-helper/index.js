/* eslint-disable max-len */

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

	static buildHooks(userConfigs = {}) {

		this.validateConfigs(userConfigs);

		this.setConfigsWithDefaults(userConfigs);

		console.log(this.buildConsumerFunction(this.consumerProperties, { mainConsumer: true }));

		return [

			this.getSQSUrlEnvVars(),

			this.buildConsumerFunction(this.consumerProperties, { mainConsumer: true }),

			this.buildQueueResource(this.mainQueueProperties),

			this.buildQueueResource(this.dlqQueueProperties, { dlq: true }),

			...this.shouldAddConsumer(userConfigs.dlqConsumerProperties)
				? [this.buildConsumerFunction(this.dlqConsumerProperties, { dlqConsumer: true })]
				: [],

			...this.shouldAddConsumer(userConfigs.delayedConsumerProperties)
				? [
					this.buildConsumerFunction(this.delayedConsumerProperties, { delayedConsumer: true }),
					this.buildQueueResource(this.delayedQueueProperties, { delayedQueue: true })
				] : []
		];
	}

	static validateConfigs(userConfigs) {

		if(!userConfigs.name?.length)
			throw new Error('Missing or empty name hook configuration in SQS helper');

		[
			['Main Consumer', userConfigs.consumerProperties],
			['Main Queue', userConfigs.mainQueueProperties],
			['Delayed Consumer', userConfigs.delayedConsumerProperties],
			['Delayed Queue', userConfigs.delayedQueueProperties],
			['DLQ Consumer', userConfigs.dlqConsumerProperties],
			['DLQ Queue', userConfigs.dlqQueueProperties]
		].forEach(([type, properties]) => {
			if(properties && (typeof properties !== 'object' || Array.isArray(properties)))
				throw new Error(`${type} Properties must be an Object with configuration in SQS helper`);
		});
	}

	static setConfigsWithDefaults(userConfigs) {

		this.consumerProperties = { ...consumerDefaultsValue, ...userConfigs.consumerProperties };
		this.mainQueueProperties = { ...mainQueueDefaultsValue, ...userConfigs.mainQueueProperties };

		this.delayedConsumerProperties = { ...consumerDefaultsValue, ...userConfigs.delayedConsumerProperties };
		this.delayedQueueProperties = { ...mainQueueDefaultsValue, ...userConfigs.delayedQueueProperties };

		this.dlqConsumerProperties = { ...dlqConsumerDefaultsValue, ...userConfigs.dlqConsumerProperties };
		this.dlqQueueProperties = { ...dlqQueueDefaultsValue, ...userConfigs.dlqQueueProperties };

		this.fifoQueue = !!userConfigs.mainQueueProperties?.fifoQueue;
		this.useDelayedQueue = !!userConfigs.delayedQueueProperties;

		this.names = generateQueueNames(userConfigs.name);

		this.arns = generateArns(this.names, this.fifoQueue);
	}

	static shouldAddConsumer(consumerProperties) {
		return consumerProperties
			&& Object.keys(consumerProperties).length
			&& !consumerProperties.useMainHandler;
	}

	static getSQSUrlEnvVars() {
		return ['envVars', {
			[`${this.names.envVarName}_SQS_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${this.fifoQueue ? addFifoSuffix(this.names.mainQueue) : this.names.mainQueue}`,
			[`${this.names.envVarName}_DLQ_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${this.fifoQueue ? addFifoSuffix(this.names.dlq) : this.names.dlq}`,

			...this.useDelayedQueue && {
				[`${this.names.envVarName}_DELAYED_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${this.fifoQueue ? addFifoSuffix(this.names.delayedQueue) : this.names.delayedQueue}`
			}
		}];
	}

	static buildConsumerFunction({
		timeout,
		handler,
		description,
		maximumBatchingWindow,
		batchSize,
		prefixPath,
		functionProperties,
		rawProperties,
		eventProperties
	}, {
		mainConsumer,
		dlqConsumer,
		delayedConsumer
	}) {

		let { filename, titleName: functionName } = this.names;

		let queueArn = this.arns.mainQueue;
		let dependsOn = this.names.mainQueue;

		if(delayedConsumer) {
			queueArn = this.arns.delayedQueue;
			dependsOn = this.names.delayedQueue;
			functionName = `${functionName}Delayed`;
			filename = `${filename}-delayed`;
		} else if(dlqConsumer) {
			queueArn = this.arns.dlq;
			dependsOn = this.names.dlq;
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
				dependsOn: [dependsOn],
				...rawProperties
			},
			events: [
				this.createEventSource(queueArn, { batchSize, maximumBatchingWindow, eventProperties }),
				...mainConsumer && this.delayedConsumerProperties?.useMainHandler ? [this.createEventSource(this.arns.delayedQueue, this.delayedConsumerProperties)] : [],
				...mainConsumer && this.dlqConsumerProperties?.useMainHandler ? [this.createEventSource(this.arns.dlq, this.dlqConsumerProperties)] : []
			],
			...functionProperties
		}];
	}

	static createEventSource(arn, {
		batchSize,
		maximumBatchingWindow,
		eventProperties
	}) {
		return {
			sqs: {
				arn,
				functionResponseType: 'ReportBatchItemFailures',
				...batchSize && { batchSize },
				...maximumBatchingWindow && { maximumBatchingWindow },
				...eventProperties
			}
		};
	}

	static buildQueueResource({
		maxReceiveCount,
		receiveMessageWaitTimeSeconds,
		visibilityTimeout,
		messageRetentionPeriod,
		fifoQueue,
		fifoThroughputLimit,
		contentBasedDeduplication,
		deduplicationScope,
		...extraProperties
	}, {
		dlq,
		delayedQueue
	} = {}) {

		let name = this.names.mainQueue;

		let deadLetterTargetArn;
		let dependsOn;

		if(delayedQueue) {
			name = this.names.delayedQueue;

			deadLetterTargetArn = this.arns.dlq;

		} else if(dlq)
			name = this.names.dlq;

		else {
			// main queue

			deadLetterTargetArn = this.useDelayedQueue ? this.arns.delayedQueue : this.arns.dlq;
			dependsOn = this.useDelayedQueue ? this.names.delayedQueue : this.names.dlq;
		}

		return ['resource', {
			name,
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: `\${self:custom.serviceName}${this.fifoQueue ? addFifoSuffix(name) : name}`,
					ReceiveMessageWaitTimeSeconds: receiveMessageWaitTimeSeconds,
					VisibilityTimeout: visibilityTimeout,
					// eslint-disable-next-line max-len
					...deadLetterTargetArn && {
						RedrivePolicy: JSON.stringify({ maxReceiveCount, deadLetterTargetArn })
					},
					...messageRetentionPeriod && { MessageRetentionPeriod: messageRetentionPeriod },
					...this.fifoQueue && { FifoQueue: true },
					...this.fifoQueue && fifoThroughputLimit && { FifoThroughputLimit: fifoThroughputLimit },
					...this.fifoQueue && deduplicationScope && { DeduplicationScope: deduplicationScope },
					...this.fifoQueue && contentBasedDeduplication && { ContentBasedDeduplication: true },
					Tags: [
						...defaultTags,
						{ Key: 'SQSConstruct', Value: this.names.titleName },
						...dlq ? [{ Key: 'IsDLQ', Value: 'true' }] : [],
						...delayedQueue ? [{ Key: 'DelayedQueue', Value: 'true' }] : []
					],
					...extraProperties
				},
				...dependsOn && { DependsOn: [dependsOn] }
			}
		}];
	}
};
