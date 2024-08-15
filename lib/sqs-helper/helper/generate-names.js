'use strict';

const { upperSnakeCase, kebabCase, upperCamelCase } = require('../../utils/string');

module.exports = name => {

	const titleName = upperCamelCase(name);

	return {
		titleName,
		filename: kebabCase(name),
		envVarName: upperSnakeCase(name),
		mainQueue: `${titleName}Queue`,
		delayQueue: `${titleName}DelayQueue`,
		dlq: `${titleName}DLQ`
	};
};
