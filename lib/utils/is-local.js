'use strict';

module.exports.isLocal = () => process.env.JANIS_LOCAL === '1' || process.env.NODE_ENV === 'dev';
