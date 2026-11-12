'use strict';

const { DEFAULT_RUNTIME } = require('./runtime');
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
 * @param {Object<string, string>} traceLayers The trace layer ARN by runtime
 * @param {string} runtime A literal runtime, like nodejs22.x
 */
const validateTraceLayerRuntime = (traceLayers, runtime) => {
	if(!traceLayers[runtime]) {
		const availableRuntimes = Object.keys(traceLayers).join(', ');
		throw new Error(`Missing trace layer for runtime ${runtime} in JANIS_TRACE_LAYERS env var. Available runtimes: ${availableRuntimes}`);
	}
};

/**
 * Resolves the trace layer for the provider runtime. The same string must be used in every hook, as layers are compared before variables resolution.
 *
 * @param {string} [runtime] The provider runtime: a literal runtime or a Serverless variable, like ${param:runtime}. Defaults to nodejs22.x
 * @param {string} [declaredRuntime] The literal runtime to validate when the provider runtime is a variable
 * @returns {string|undefined} The trace layer ARN, a Serverless variable that resolves to it, or undefined if JANIS_TRACE_LAYERS is not set
 */
const getTraceLayerArn = (runtime, declaredRuntime) => {

	const traceLayers = getTraceLayers();

	if(!traceLayers)
		return;

	const providerRuntime = runtime || DEFAULT_RUNTIME;

	if(!providerRuntime.includes('${')) {
		validateTraceLayerRuntime(traceLayers, providerRuntime);
		return traceLayers[providerRuntime];
	}

	if(declaredRuntime)
		validateTraceLayerRuntime(traceLayers, declaredRuntime);

	return `\${self:custom.janisTraceLayers.${providerRuntime}}`;
};

/**
 * Serverless splits ${self:...} addresses by dots, so a runtime like nodejs22.x is nested as { nodejs22: { x: arn } }
 *
 * @returns {object|undefined} The trace layer ARN by runtime to set in custom.janisTraceLayers, or undefined if JANIS_TRACE_LAYERS is not set
 */
module.exports.getResolvableTraceLayers = () => {

	const traceLayers = getTraceLayers();

	if(!traceLayers)
		return;

	return Object.entries(traceLayers).reduce((resolvableTraceLayers, [runtime, traceLayerArn]) => {

		const runtimePath = runtime.split('.');
		const lastKey = runtimePath.pop();

		const parent = runtimePath.reduce((node, key) => {
			node[key] ??= {};
			return node[key];
		}, resolvableTraceLayers);

		parent[lastKey] = traceLayerArn;

		return resolvableTraceLayers;
	}, {});
};

const shouldAddTraceLayer = () => !!process.env.JANIS_TRACE_LAYERS;

module.exports.shouldAddTraceLayer = shouldAddTraceLayer;

module.exports.getTraceLayerArn = getTraceLayerArn;

/**
 * @param {string[]} layers The function layers
 * @param {string} traceLayerArn The trace layer to remove, as returned by getTraceLayerArn()
 * @returns {string[]} The layers without the trace layer
 */
module.exports.removeTraceLayer = (layers, traceLayerArn) => layers.filter(layerArn => layerArn !== traceLayerArn);

module.exports.removeTraceLayerEnv = (skipTraceLayer = false, environment = {}) => ({
	...shouldAddTraceLayer() && skipTraceLayer ? { environment: { ...environment, JANIS_TRACE_EXTENSION_ENABLED: '' } } : {}
});
