'use strict';

const { snsTopicScopes } = require('../../utils/sns-topic-scopes');
const { baseArn } = require('./default');
const fixFifoName = require('./fix-fifo-name');

module.exports = topicConfig => {

	const topicName = fixFifoName(topicConfig.name, topicConfig.fifoTopic);

	if(topicConfig.scope === snsTopicScopes.remote) {
		return {
			topic: `${baseArn}:\${self:custom.awsAccountsByService.${topicConfig.serviceCode}}:${topicName}`
		};
	}

	return {
		topic: `${baseArn}:\${aws:accountId}:${topicName}`
	};
};
