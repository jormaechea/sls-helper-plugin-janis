'use strict';

const startCase = require('lodash.startcase');
const camelCase = require('lodash.camelcase');

const pascalCase = name => startCase(camelCase(name)).replace(/ /g, '');

const addParametersToTask = task => {

	const executeStateMachine = task.Resource === 'arn:aws:states:::states:startExecution';

	if(executeStateMachine) {
		task.Parameters = {
			...task.Parameters ? task.Parameters : {
				'session.$': '$.session',
				'body.$': '$.body'
			}
		};
	} else if(task.Parameters?.Payload)
		task.Parameters.Payload['stateMachine.$'] = '$$.StateMachine';
	else if(task.Parameters)
		task.Parameters['stateMachine.$'] = '$$.StateMachine';
	else {
		task.Parameters = {
			'session.$': '$.session',
			'body.$': '$.body',
			'stateMachine.$': '$$.StateMachine'
		};
	}
};

const addParametersToSates = states => {

	Object.values(states).forEach(step => {

		if(step.Type === 'Map')
			return addParametersToSates(step.ItemProcessor?.States || step.Iterator?.States || {});

		if(step.Type === 'Parallel')
			return step.Branches.forEach(branch => addParametersToSates(branch.States));

		if(step.Type === 'Task')
			addParametersToTask(step);
	});
};

const addStateMachineParameter = definition => {

	const definitionParsed = JSON.parse(JSON.stringify(definition));

	addParametersToSates(definitionParsed.States);

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
