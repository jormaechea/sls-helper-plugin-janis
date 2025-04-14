'use strict';

const { baseArn } = require('./default');
const fixFifoName = require('./fix-fifo-name');

module.exports = ({ mainQueue, delayQueue, dlq, dlqConsumerDlq }, fifoQueue) => {
	return {
		mainQueue: `${baseArn}:\${self:custom.serviceName}${fixFifoName(mainQueue, fifoQueue)}`,
		delayQueue: `${baseArn}:\${self:custom.serviceName}${fixFifoName(delayQueue, fifoQueue)}`,
		dlq: `${baseArn}:\${self:custom.serviceName}${fixFifoName(dlq, fifoQueue)}`,
		dlqConsumerDlq: `${baseArn}:\${self:custom.serviceName}${fixFifoName(dlqConsumerDlq, fifoQueue)}`
	};
};
