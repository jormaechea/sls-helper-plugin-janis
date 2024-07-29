'use strict';

const { baseArn } = require('./default');
const addFifoSuffix = require('./add-fifo-suffix');

module.exports = (sqsName, dlqName, fifoQueue) => {
	return {
		sqsArn: `${baseArn}:\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(sqsName) : sqsName}`,
		dlqArn: `${baseArn}:\${self:custom.serviceName}${fifoQueue ? addFifoSuffix(dlqName) : dlqName}`
	};
};
