'use strict';

const consumerDefaultsValue = {
	timeout: 15,
	// Process at most 10 records per lambda invocation
	batchSize: 10,
	// Query the queue for at most 20 seconds before executing the consumer
	maximumBatchingWindow: 20
};

const mainQueueDefaultsValue = {
	// Make 5 attempts to process messages before sending them to the DLQ
	maxReceiveCount: 5,
	// Enable long polling, allowing AWS to wait 20 seconds each time it queries the queue
	receiveMessageWaitTimeSeconds: 20,
	// Hide a message for 1:30 minutes after sending it to a consumer before showing it back
	//
	// From https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-lambda-function-trigger.html
	// To allow your function time to process each batch of records, set the source queue's visibility timeout to at least six times
	// the timeout that you configure on your function.
	// The extra time allows for Lambda to retry if your function is throttled while processing a previous batch.
	visibilityTimeout: 90,
	generateEnvVars: true
};

const delayQueueDefaultsValue = {
	...mainQueueDefaultsValue,
	// The time in seconds for which the delivery of all messages in the queue is delayed. You can specify an integer value of 0 to 900 (15 minutes).
	delaySeconds: 300,
	generateEnvVars: false
};

const dlqConsumerDefaultsValue = {
	timeout: 15
};

const dlqQueueDefaultsValue = {
	maxReceiveCount: 5,
	// Enable long polling, allowing AWS to wait 20 seconds each time it queries the queue
	receiveMessageWaitTimeSeconds: 20,
	// Hide a message for 1:30 minutes after sending it to a consumer before showing it back
	visibilityTimeout: 90,
	// Keep a message in the DLQ for 10 days before deleting it
	messageRetentionPeriod: 864000,
	generateEnvVars: false
};

const dlqConsumerDLQQueueDefaultsValue = {
	// Enable long polling, allowing AWS to wait 20 seconds each time it queries the queue
	receiveMessageWaitTimeSeconds: 20,
	// Hide a message for 1:30 minutes after sending it to a consumer before showing it back
	visibilityTimeout: 90,
	// Keep a message in the DLQ for 10 days before deleting it
	messageRetentionPeriod: 864000,
	generateEnvVars: false
};

module.exports = {
	consumerDefaultsValue,
	mainQueueDefaultsValue,
	delayQueueDefaultsValue,
	dlqQueueDefaultsValue,
	dlqConsumerDefaultsValue,
	dlqConsumerDLQQueueDefaultsValue,
	// eslint-disable-next-line no-template-curly-in-string
	baseArn: 'arn:aws:sqs:${aws:region}:${aws:accountId}',
	baseUrl: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/'
};
