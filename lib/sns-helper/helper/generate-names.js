'use strict';

const { upperSnakeCase } = require('../../utils/string');

module.exports = name => {
	return {
		envVarName: upperSnakeCase(name),
		topic: `${name}Topic`,
		topicPolicy: `${name}TopicPolicy`
	};
};
