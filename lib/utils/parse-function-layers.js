'use strict';

const { getTraceLayerArn, shouldAddTraceLayer, removeTraceLayer } = require('./trace-layer');

/**
 * Layers should be set at the function level if custom layers are passed (event if passed as an empty array), or trace layer should be skipped for this one function
 *
 * @param {string[]} layers A list of layers to override for the function
 * @param {string[]} addLayers A list of layers to append for the function
 * @param {boolean} skipTraceLayer A boolean indicating if trace layer should be removed from this function
 * @param {object} serviceConfig The serverless current service config
 * @returns {object} An object with an optional `layers` property
 */
module.exports.parseFunctionLayers = (layers, addLayers, skipTraceLayer, serviceConfig) => {

	const traceLayerArn = getTraceLayerArn();

	// Layers should be set at the function level if custom layers are passed (event if passed as an empty array), or trace layer should be skipped for this one function
	const shouldSetLayers = !!layers || !!addLayers?.length || (shouldAddTraceLayer() && skipTraceLayer);

	if(!shouldSetLayers)
		return {};

	let functionLayers = [];

	if(layers) {

		// Add trace layer by default
		if(traceLayerArn)
			functionLayers.push(traceLayerArn);

		// Set custom layers
		functionLayers.push(...layers);

	} else {

		// Inherit from provider-level layers
		functionLayers.push(...serviceConfig?.provider?.layers || []);

		// Add custom layers
		if(addLayers?.length)
			functionLayers.push(...addLayers);

	}

	// If trace layer was added but should be skipped for this function, remove it
	if(shouldAddTraceLayer() && skipTraceLayer)
		functionLayers = removeTraceLayer(functionLayers);

	return { layers: functionLayers };
};
