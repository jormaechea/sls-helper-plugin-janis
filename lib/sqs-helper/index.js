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
const fixFifoName = require('./helper/fix-fifo-name');
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

		this.setConfigsWithDefaults(configs);

		const delayedHooks = [];

		if(this.useDelayedQueue) {

			// is used this.delayedConsumerProperties cause must have a consumer (the own consumer or the main consumer)
			// this.delayedConsumerProperties has default mainConsumer configs
			if(this.shouldAddConsumer(this.delayedConsumerProperties))
				delayedHooks.push(this.buildConsumerFunction(this.delayedConsumerProperties, { delayedConsumer: true }));

			delayedHooks.push(this.buildQueueResource(this.delayedQueueProperties, { delayedQueue: true }));
		}

		return [

			this.getSQSUrlEnvVars(),

			this.buildConsumerFunction(this.consumerProperties, { mainConsumer: true }),

			this.buildQueueResource(this.mainQueueProperties, { mainQueue: true }),

			...delayedHooks,

			this.buildQueueResource(this.dlqQueueProperties, { dlq: true }),

			...this.shouldAddConsumer(configs.dlqConsumerProperties)
				? [this.buildConsumerFunction(this.dlqConsumerProperties, { dlqConsumer: true })]
				: []
		];
	}

	static validateConfigs(configs) {

		if(!configs.name?.length)
			throw new Error('Missing or empty name hook configuration in SQS helper');

		[
			['Main Consumer', configs.consumerProperties],
			['Main Queue', configs.mainQueueProperties],
			['Delayed Consumer', configs.delayedConsumerProperties],
			['Delayed Queue', configs.delayedQueueProperties],
			['DLQ Consumer', configs.dlqConsumerProperties],
			['DLQ Queue', configs.dlqQueueProperties]
		].forEach(([type, properties]) => {
			if(properties && (typeof properties !== 'object' || Array.isArray(properties)))
				throw new Error(`${type} Properties must be an Object with configuration in SQS helper`);
		});
	}

	static setConfigsWithDefaults(userConfigs) {

		this.consumerProperties = { ...consumerDefaultsValue, ...userConfigs.consumerProperties };
		this.mainQueueProperties = { ...mainQueueDefaultsValue, ...userConfigs.mainQueueProperties };

		// delayed queue and consumer uses main config by default
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
			[`${this.names.envVarName}_SQS_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${fixFifoName(this.names.mainQueue, this.fifoQueue)}`,
			[`${this.names.envVarName}_DLQ_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${fixFifoName(this.names.dlq, this.fifoQueue)}`,

			...this.useDelayedQueue && {
				[`${this.names.envVarName}_DELAYED_QUEUE_URL`]: `${baseUrl}\${self:custom.serviceName}${fixFifoName(this.names.delayedQueue, this.fifoQueue)}`
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
		delayedConsumer
	}) {

		let { filename, titleName: functionName } = this.names;

		let queueArn;
		let dependsOn;

		if(mainConsumer) {
			queueArn = this.arns.mainQueue;
			dependsOn = this.names.mainQueue;
		} else if(delayedConsumer) {
			queueArn = this.arns.delayedQueue;
			dependsOn = this.names.delayedQueue;
			functionName = `${functionName}Delayed`;
			filename = `${filename}-delayed`;
		} else {
			// dlq consumer
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
		mainQueue,
		dlq,
		delayedQueue
	}) {

		let name;
		let deadLetterTargetArn;
		let dependsOn;

		if(mainQueue) {
			name = this.names.mainQueue;
			deadLetterTargetArn = this.useDelayedQueue ? this.arns.delayedQueue : this.arns.dlq;
			dependsOn = this.useDelayedQueue ? this.names.delayedQueue : this.names.dlq;
		} else if(delayedQueue) {
			name = this.names.delayedQueue;
			deadLetterTargetArn = this.arns.dlq;
			dependsOn = this.names.dlq;
		} else {
			// dlq
			name = this.names.dlq;
		}

		return ['resource', {
			name,
			resource: {
				Type: 'AWS::SQS::Queue',
				Properties: {
					QueueName: `\${self:custom.serviceName}${fixFifoName(name, this.fifoQueue)}`,
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
