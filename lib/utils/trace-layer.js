'use strict';

const { isObject } = require('./is-object');

/**
 * @returns {Object<string, string>|undefined} The trace layer ARN by runtime, parsed from the JANIS_TRACE_LAYERS env var
 */
const getTraceLayers = () => {

	if(!process.env.JANIS_TRACE_LAYERS)
		return;

	let traceLayers;

	try {
		traceLayers = JSON.parse(process.env.JANIS_TRACE_LAYERS);
	} catch(err) {
		throw new Error(`Invalid JANIS_TRACE_LAYERS env var. It must be a JSON string: ${err.message}`);
	}

	const isValid = isObject(traceLayers)
		&& !!Object.keys(traceLayers).length
		&& Object.values(traceLayers).every(traceLayerArn => traceLayerArn && typeof traceLayerArn === 'string');

	if(!isValid)
		throw new Error('Invalid JANIS_TRACE_LAYERS env var. It must be a non-empty JSON object with the layer ARN by runtime: {"nodejs22.x":"arn:..."}');

	return traceLayers;
};

/**
 * @param {string} runtime The runtime declared in the janis.base hook, like nodejs22.x
 * @returns {string|undefined} The trace layer ARN of the runtime, or undefined if JANIS_TRACE_LAYERS is not set
 */
module.exports.getTraceLayerArn = runtime => {

	const traceLayers = getTraceLayers();

	if(!traceLayers)
		return;

	if(!traceLayers[runtime]) {
		const availableRuntimes = Object.keys(traceLayers).join(', ');
		throw new Error(`Missing trace layer for runtime ${runtime} in JANIS_TRACE_LAYERS env var. Available runtimes: ${availableRuntimes}`);
	}

	return traceLayers[runtime];
};

/**
 * The runtime is only known in the janis.base hook, which adds the trace layer to the provider layers.
 * Function helpers take it from there.
 *
 * @param {object} serviceConfig The serverless current service config
 * @returns {string|undefined} The trace layer ARN set in provider.layers, if any
 */
module.exports.findTraceLayerArn = serviceConfig => {

	const traceLayers = getTraceLayers();

	if(!traceLayers)
		return;

	return serviceConfig?.provider?.layers?.find(layerArn => Object.values(traceLayers).includes(layerArn));
};

const shouldAddTraceLayer = () => !!process.env.JANIS_TRACE_LAYERS;

/**
 * @param {string[]} layers The function layers
 * @param {string} traceLayerArn The trace layer to remove
 * @returns {string[]} The layers without the trace layer
 */
module.exports.removeTraceLayer = (layers, traceLayerArn) => layers.filter(layerArn => layerArn !== traceLayerArn);

module.exports.removeTraceLayerEnv = (skipTraceLayer = false, environment = {}) => ({
	...shouldAddTraceLayer() && skipTraceLayer ? { environment: { ...environment, JANIS_TRACE_EXTENSION_ENABLED: '' } } : {}
});
