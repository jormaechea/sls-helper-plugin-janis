'use strict';

const defaultEnvVars = require('./default-env-vars');

const shouldAddTraceLayer = () => process.env.TRACE_ACCOUNT_ID && process.env.JANIS_TRACE_EXTENSION_VERSION;

const getTraceLayerArn = () => {
	if(shouldAddTraceLayer())
		return `arn:aws:lambda:\${aws:region}:${process.env.TRACE_ACCOUNT_ID}:layer:trace:${process.env.JANIS_TRACE_EXTENSION_VERSION}`;
};

module.exports.shouldAddTraceLayer = shouldAddTraceLayer;

module.exports.getTraceLayerArn = getTraceLayerArn;

module.exports.removeTraceLayer = layers => layers.filter(layerArn => layerArn !== getTraceLayerArn());

module.exports.removeTraceLayerEnv = (skipTraceLayer = false) => {
	return shouldAddTraceLayer() && skipTraceLayer
		? { environment: { ...defaultEnvVars } }
		: {};
};
