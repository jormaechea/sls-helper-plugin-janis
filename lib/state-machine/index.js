'use strict';

const startCase = require('lodash.startcase');
const camelCase = require('lodash.camelcase');

const pascalCase = name => startCase(camelCase(name)).replace(/ /g, '');

const stateMachineFunction = ({
	name: stepMachineName,
	definition
}) => {

	const stepMachineConfiguration = {
		name: stepMachineName,
		definition
	};

	const stepMachineNameInPascalCase = pascalCase(stepMachineName);

	return {
		[`SM-${stepMachineNameInPascalCase}`]: stepMachineConfiguration
	};
};

const stateMachine = ({
	name: stepMachineName
}) => {

	const stepMachineNameInCamelCase = camelCase(stepMachineName);
	const stepMachineNameInPascalCase = pascalCase(stepMachineName);

	return {
		[stepMachineNameInPascalCase]: {
			name: `SM-\${self:custom.serviceName}-${stepMachineNameInCamelCase}-\${self:custom.stage}`,
			arn: {
				'Fn::Join': [
					':',
					[
						'arn:aws:states',
						'${self:custom.region}',
						{ Ref: 'AWS::AccountId' },
						'stateMachine',
						`\${self:custom.machines.${stepMachineNameInCamelCase}.name}`
					]
				]
			}
		}
	};
};

module.exports = ({ custom = {}, plugins, stepFunctions = {}, ...serviceConfig }, hookParams) => {

	const { machines } = custom;

	if(!hookParams.name)
		throw new Error('Missing or empty name in janis.stepMachine hook.');

	if(!hookParams.definition)
		throw new Error('Missing or empty definition in janis.stepMachine hook.');

	return {
		...serviceConfig,
		plugins: [
			...(plugins || []),
			'serverless-step-functions'
		],
		stepFunctions: {
			stateMachines: {
				...(stepFunctions.stateMachines || {}),
				...stateMachineFunction(hookParams)
			}
		},
		custom: {
			...custom,
			machines: {
				...machines || {},
				...stateMachine(hookParams)
			}
		}
	};
};
