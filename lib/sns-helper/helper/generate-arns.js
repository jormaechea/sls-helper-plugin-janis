'use strict';

const { snsTopicScopes } = require('../../utils/sns-topic-scopes');

const baseArn = 'arn:aws:sns:${aws:region}';

module.exports = topicConfig => {

	if(topicConfig.scope === snsTopicScopes.remote) {
		return {
			topic: `${baseArn}:\${self:custom.awsAccountsByService.${topicConfig.serviceCode}}:${topicConfig.name}`
		};
	}

	return {
		topic: `${baseArn}:\${aws:accountId}:${topicConfig.name}`
	};
};
