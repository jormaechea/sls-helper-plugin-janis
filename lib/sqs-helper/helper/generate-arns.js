'use strict';

const { baseArn } = require('./default');
const fixFifoName = require('./fix-fifo-name');

module.exports = ({ mainQueue, delayQueue, dlq }, fifoQueue) => {
	return {
		mainQueue: `${baseArn}:\${self:custom.serviceName}${fixFifoName(mainQueue, fifoQueue)}`,
		delayQueue: `${baseArn}:\${self:custom.serviceName}${fixFifoName(delayQueue, fifoQueue)}`,
		dlq: `${baseArn}:\${self:custom.serviceName}${fixFifoName(dlq, fifoQueue)}`
	};
};
