'use strict';

const baseArn = 'arn:aws:sns:${aws:region}:${aws:accountId}';

module.exports = topicName => {
	return {
		topic: `${baseArn}:${topicName}`
	};
};
