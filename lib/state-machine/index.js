'use strict';

const { defaultTags } = require('../utils/default-tags');
const { addResource } = require('../utils/resources');
const { camelCase, upperCamelCase } = require('../utils/string');

const validWorkflowTypes = {
	STANDARD: 'STANDARD',
	EXPRESS: 'EXPRESS'
};

const stateMachineData = { key: 'stateMachine.$', value: '$$.StateMachine' };
const stateData = { key: 'state.$', value: '$$.State' };

const addParametersToTask = task => {

	const executeStateMachine = task.Resource === 'arn:aws:states:::states:startExecution';

	if(executeStateMachine)
		return;

	if(task.Parameters?.Payload) {
		task.Parameters.Payload[stateMachineData.key] = stateMachineData.value;
		task.Parameters.Payload[stateData.key] = stateData.value;
	} else if(task.Parameters?.Input) {
		task.Parameters.Input[stateMachineData.key] = stateMachineData.value;
		task.Parameters.Input[stateData.key] = stateData.value;
	} else if(task.Parameters?.Target?.Input) {
		task.Parameters.Target.Input[stateMachineData.key] = stateMachineData.value;
		task.Parameters.Target.Input[stateData.key] = stateData.value;
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

const parseLoggingConfig = hookParams => {

	if(!hookParams?.loggingConfig)
		return;

	let computedLoggingConfig;

	if(hookParams.loggingConfig === true) {

		computedLoggingConfig = {
			level: 'INFO',
			includeExecutionData: true
		};

	} else if(typeof hookParams.loggingConfig === 'string') {

		computedLoggingConfig = {
			level: hookParams.loggingConfig,
			includeExecutionData: true
		};

	} else
		computedLoggingConfig = { ...hookParams.loggingConfig };

	if(hookParams.loggingConfig?.destinations)
		computedLoggingConfig.destinations = hookParams.loggingConfig.destinations;
	else {
		computedLoggingConfig.destinations = [
			{
				'Fn::GetAtt': [`${upperCamelCase(hookParams.name)}LogGroup`, 'Arn']
			}
		];
	}

	return { loggingConfig: computedLoggingConfig };
};

const stateMachineFunction = hookParams => {

	const {
		name: stepMachineName,
		type,
		definition,
		rawProperties
	} = hookParams;

	const stepMachineNameInCamelCase = camelCase(stepMachineName);

	const stepMachineConfiguration = {
		...rawProperties,
		name: `\${self:custom.serviceName}-${stepMachineNameInCamelCase}-\${self:custom.stage}`,
		// By default, type is STANDARD
		...type === validWorkflowTypes.EXPRESS && { type },
		...parseLoggingConfig(hookParams),
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

const stateMachineLogGroup = (resources, hookParams) => {

	if(!hookParams.loggingConfig || hookParams.loggingConfig.destinations)
		return resources && { resources };

	// Create log group
	const logGroupName = `${upperCamelCase(hookParams.name)}LogGroup`;
	const logGroupDefinition = {
		Type: 'AWS::Logs::LogGroup',
		Properties: {
			LogGroupName: `/janis/state-machine/\${self:custom.serviceName}-${hookParams.name}-\${self:custom.stage}`,
			RetentionInDays: 60,
			Tags: defaultTags
		}
	};

	return { resources: addResource(resources, logGroupName, logGroupDefinition) };
};

module.exports = ({
	custom = {}, plugins, resources, stepFunctions = {}, ...serviceConfig
}, hookParams) => {

	const { machines } = custom;

	if(!hookParams.name)
		throw new Error('Missing or empty name in janis.stepMachine hook.');

	if(!hookParams.definition)
		throw new Error('Missing or empty definition in janis.stepMachine hook.');

	if(hookParams.type && !validWorkflowTypes[hookParams.type])
		throw new Error(`Invalid 'type' in janis.stepMachine hook. Sent: ${hookParams.type}. Valid values: [${Object.keys(validWorkflowTypes)}]`);

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
		},
		...stateMachineLogGroup(resources, hookParams)
	};
};
