'use strict';

const consumerDefaultsValue = {
	timeout: 15,
	batchSize: 1,
	maximumBatchingWindow: 10
};

const mainQueueDefaultsValue = {
	maxReceiveCount: 5,
	receiveMessageWaitTimeSeconds: 20,
	visibilityTimeout: 60
};

const dlqQueueDefaultsValue = {
	receiveMessageWaitTimeSeconds: 5,
	visibilityTimeout: 20,
	messageRetentionPeriod: 864000 // 10 days
};

module.exports = {
	consumerDefaultsValue,
	mainQueueDefaultsValue,
	dlqQueueDefaultsValue,
	// eslint-disable-next-line no-template-curly-in-string
	baseArn: 'arn:aws:sqs:${aws:region}:${aws:accountId}',
	baseUrl: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/'
};
