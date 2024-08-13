'use strict';

const { baseArn } = require('./default');
const fixFifoName = require('./fix-fifo-name');

module.exports = ({ mainQueue, delayedQueue, dlq }, fifoQueue) => {
	return {
		mainQueue: `${baseArn}:\${self:custom.serviceName}${fixFifoName(mainQueue, fifoQueue)}`,
		delayedQueue: `${baseArn}:\${self:custom.serviceName}${fixFifoName(delayedQueue, fifoQueue)}`,
		dlq: `${baseArn}:\${self:custom.serviceName}${fixFifoName(dlq, fifoQueue)}`
	};
};
