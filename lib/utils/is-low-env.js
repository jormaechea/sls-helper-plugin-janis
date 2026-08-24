'use strict';

const { isLocal } = require('./is-local');

const lowEnvs = ['beta', 'qa'];

module.exports.isLowEnv = () => isLocal() || lowEnvs.includes(process.env.ENV);
