'use strict';

const { camelCase, upperCamelCase } = require('../utils/string');

const stateMachineData = { key: 'stateMachine.$', value: '$$.StateMachine' };
const stateData = { key: 'state.$', value: '$$.State' };

const addParametersToTask = task => {

	const executeStateMachine = task.Resource === 'arn:aws:states:::states:startExecution';

	if(executeStateMachine)
		return;

	if(task.Parameters?.Payload) {
		task.Parameters.Payload[stateMachineData.key] = stateMachineData.value;
		task.Parameters.Payload[stateData.key] = stateData.value;
	} else if(task.Parameters) {
		task.Parameters[stateMachineData.key] = stateMachineData.value;
		task.Parameters[stateData.key] = stateData.value;
	} else {
		task.Parameters = {
			'session.$': '$.session',
			'body.$': '$.body',
			[stateMachineData.key]: stateMachineData.value,
			[stateData.key]: stateData.value
		};
	}
};

const addParametersToStates = states => {

	const stepsToExclude = Object.values(states).reduce((accum, step) => {

		if(step.Type === 'Parallel' && step.Next)
			accum.push(step.Next);

		return accum;
	}, []);

	Object.entries(states).forEach(([stepName, step]) => {

		if(step.Type === 'Map')
			return addParametersToStates(step.ItemProcessor?.States || step.Iterator?.States || {});

		if(step.Type === 'Parallel')
			return step.Branches.forEach(branch => addParametersToStates(branch.States));

		if(step.Type === 'Task' && !stepsToExclude.includes(stepName))
			addParametersToTask(step);
	});
};

const addStateMachineParameter = definition => {

	const definitionParsed = JSON.parse(JSON.stringify(definition));

	addParametersToStates(definitionParsed.States);

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

	const stepMachineNameInUpperCamelCase = upperCamelCase(stepMachineName);

	return {
		[stepMachineNameInUpperCamelCase]: stepMachineConfiguration
	};
};

const stateMachine = ({
	name: stepMachineName
}) => {

	const stepMachineNameInCamelCase = camelCase(stepMachineName);
	const stepMachineNameInUpperCamelCase = upperCamelCase(stepMachineName);

	return {
		[stepMachineNameInUpperCamelCase]: {
			name: `\${self:custom.serviceName}-${stepMachineNameInCamelCase}-\${self:custom.stage}`,
			arn: {
				'Fn::Join': [
					':',
					[
						'arn:aws:states',
						'${self:custom.region}',
						{ Ref: 'AWS::AccountId' },
						'stateMachine',
						`\${self:custom.machines.${stepMachineNameInUpperCamelCase}.name}`
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
