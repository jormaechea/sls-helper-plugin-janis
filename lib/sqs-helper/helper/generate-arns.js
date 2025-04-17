'use strict';

const { baseArn } = require('./default');
const fixFifoName = require('./fix-fifo-name');

const buildArn = (queue, fifoQueue) => `${baseArn}:\${self:custom.serviceName}${fixFifoName(queue, fifoQueue)}`;

module.exports = ({ mainQueue, delayQueue, dlq, archiveDlq }, fifoQueue) => {
	return {
		mainQueue: buildArn(mainQueue, fifoQueue),
		delayQueue: buildArn(delayQueue, fifoQueue),
		dlq: buildArn(dlq, fifoQueue),
		archiveDlq: buildArn(archiveDlq, fifoQueue)
	};
};
