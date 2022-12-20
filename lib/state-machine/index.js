'use strict';

const startCase = require('lodash.startcase');
const camelCase = require('lodash.camelcase');

const pascalCase = name => startCase(camelCase(name)).replace(/ /g, '');

const addStateMachineParameter = definition => {

	const definitionParsed = JSON.parse(JSON.stringify(definition));

	Object.values(definitionParsed.States).forEach(step => {

		if(step.Type !== 'Task')
			return;

		if(step.Parameters?.Payload)
			step.Parameters.Payload['stateMachine.$'] = '$$.StateMachine';
		else if(step.Parameters)
			step.Parameters['stateMachine.$'] = '$$.StateMachine';
		else {
			step.Parameters = {
				'session.$': '$.session',
				'body.$': '$.body',
				'stateMachine.$': '$$.StateMachine'
			};
		}
	});

	return definitionParsed;
};

const stateMachineFunction = ({
	name: stepMachineName,
	definition
}) => {

	const stepMachineNameInCamelCase = camelCase(stepMachineName);

	const stepMachineConfiguration = {
		name: `\${self:custom.serviceName}-${stepMachineNameInCamelCase}-\${self:custom.stage}`,
		definition: addStateMachineParameter(definition)
	};

	const stepMachineNameInPascalCase = pascalCase(stepMachineName);

	return {
		[stepMachineNameInPascalCase]: stepMachineConfiguration
	};
};

const stateMachine = ({
	name: stepMachineName
}) => {

	const stepMachineNameInCamelCase = camelCase(stepMachineName);
	const stepMachineNameInPascalCase = pascalCase(stepMachineName);

	return {
		[stepMachineNameInPascalCase]: {
			name: `\${self:custom.serviceName}-${stepMachineNameInCamelCase}-\${self:custom.stage}`,
			arn: {
				'Fn::Join': [
					':',
					[
						'arn:aws:states',
						'${self:custom.region}',
						{ Ref: 'AWS::AccountId' },
						'stateMachine',
						`\${self:custom.machines.${stepMachineNameInPascalCase}.name}`
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

	const pluginsSet = new Set(plugins || []);
	pluginsSet.add('serverless-step-functions');

	return {
		...serviceConfig,
		plugins: [...pluginsSet],
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
