'use strict';

/**
 * @typedef {object} SQSConfig
 * @property {number} [ReceiveMessageWaitTimeSeconds=5] Default value: `5`
 * @property {number} [VisibilityTimeout=300] Default value: `300`
 */

/**
 * @typedef {object} ConsumerConfig
 * @property {string} [functionName] Default value: `${queueName}Consumer`
 * @property {string} [description] Default value: Titled case version of `functionName`
 * @property {string} [handler] Default value: `src/sqs-consumers/${kebabcase(functionName)}.handler`
 * @property {number} [timeout]
 * @property {number} [reservedConcurrency]
 */

/**
 * @typedef {object} ConsumerEventConfig
 * @property {number} [batchSize=1] Default value: `1`
 * @property {number} [maximumBatchingWindow=10] Default value: `10`
 * @property {string} [functionResponseType='ReportBatchItemFailures'] Default value: `'ReportBatchItemFailures'`
 */

/**
 * @typedef {object} QueueDefinition
 * @property {string} name The Queue name. It will be prefixed with the service name. For example, for a service "Catalog" and name "PendingProducts" the queue will be named "CatalogPendingProducts"
 * @property {SQSConfig} config The Queue configuration
 * @property {ConsumerConfig} consumer The SQS Consumer config
 * @property {ConsumerEventConfig} consumerEvent The SQS Consumer Event config
 */

const startCase = require('lodash.startcase');

const kebabcase = require('../utils/kebabcase');

const getQueueLogicalId = queueName => `${queueName}Queue`;

const makeSqs = (mainQueueName, queueConfiguration, dlqQueueName) => {
	return ['resource', {
		name: getQueueLogicalId(mainQueueName),
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: `\${self:custom.serviceName}${mainQueueName}`,
				ReceiveMessageWaitTimeSeconds: queueConfiguration?.ReceiveMessageWaitTimeSeconds || 5,
				VisibilityTimeout: queueConfiguration?.VisibilityTimeout || 300,
				...dlqQueueName && {
					RedrivePolicy: JSON.stringify({
						maxReceiveCount: 3,
						deadLetterTargetArn: `arn:aws:sqs:\${aws:region}:\${aws:accountId}:\${self:custom.serviceName}${dlqQueueName}`
					})
				}
			},
			...dlqQueueName && { DependsOn: [getQueueLogicalId(dlqQueueName)] }
		}
	}];
};

const makeConsumer = (queueName, consumerConfig, consumerEventConfig) => {

	const defaultFunctionName = `${queueName}Consumer`;
	const defaultFunctionDescription = startCase(consumerConfig?.functionName || defaultFunctionName);
	const defaultHandler = `src/sqs-consumers/${kebabcase(consumerConfig?.functionName || defaultFunctionName)}.handler`;

	return [
		'function',
		{
			functionName: consumerConfig?.functionName || defaultFunctionName,
			handler: consumerConfig?.handler || defaultHandler,
			description: consumerConfig?.description || defaultFunctionDescription,
			...consumerConfig?.timeout && { timeout: consumerConfig.timeout },
			...consumerConfig?.reservedConcurrency && { reservedConcurrency: consumerConfig.reservedConcurrency },
			rawProperties: {
				dependsOn: [getQueueLogicalId(queueName)]
			},
			events: [
				{
					sqs: {
						arn: `arn:aws:sqs:\${aws:region}:\${aws:accountId}:${queueName}`,
						batchSize: consumerEventConfig?.batchSize || 1,
						maximumBatchingWindow: consumerEventConfig?.maximumBatchingWindow || 10,
						functionResponseType: consumerEventConfig?.functionResponseType || 'ReportBatchItemFailures'
					}
				}
			]
		}
	];
};

/**
 * @param {QueueDefinition} queueDefinition The Main Queue definition
 * @param {QueueDefinition} [dlqDefinition] The DLQ definition
 */
const sqs = (queueDefinition, dlqDefinition = {}) => {

	const hooks = [];

	const {
		name: queueName,
		config: queueConfiguration,
		consumer: queueConsumer,
		consumerEvent: queueConsumerEventConfig
	} = queueDefinition;

	const {
		name: dlqNameOrNull,
		config: dlqConfiguration,
		consumer: dlqConsumer,
		consumerEvent: dlqConsumerEventConfig
	} = dlqDefinition;

	const dlqName = dlqNameOrNull ?? `${queueName}DLQ`;

	hooks.push(makeSqs(queueName, queueConfiguration, dlqName));
	hooks.push(makeConsumer(queueName, queueConsumer, queueConsumerEventConfig));

	hooks.push(makeSqs(dlqName, dlqConfiguration));

	if(dlqConsumer)
		hooks.push(makeConsumer(dlqName, dlqConsumer, dlqConsumerEventConfig));

	return hooks;
};

module.exports = sqs;
