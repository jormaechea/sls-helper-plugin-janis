'use strict';

const { baseArn } = require('./default');
const addFifoSuffix = require('./add-fifo-suffix');

module.exports = ({ mainQueue, delayedQueue, dlq }, fifoQueue) => {
	return {
		mainQueue: `${baseArn}:\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(mainQueue) : mainQueue}`,
		delayedQueue: `${baseArn}:\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(delayedQueue) : delayedQueue}`,
		dlq: `${baseArn}:\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(dlq) : dlq}`
	};
};
