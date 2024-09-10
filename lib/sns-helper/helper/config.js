'use strict';

const Validator = require('fastest-validator');

const validator = new Validator();

const configSchema = {
	topic: {
		type: 'object',
		props: {
			name: {
				type: 'string',
				empty: false,
				// Topic name validation: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sns-topic.html#cfn-sns-topic-topicname
				min: 1,
				max: 256,
				pattern: /^[0-9a-z_-]+$/i
			}
		}
	}
};

const configSchemaValidator = validator.compile(configSchema);

module.exports = {

	validate: config => {
		const result = configSchemaValidator(config);

		if(result === true)
			return;

		const [firstError] = result;
		throw new Error(`SNS config validation error: ${firstError.message}`);
	}

};
