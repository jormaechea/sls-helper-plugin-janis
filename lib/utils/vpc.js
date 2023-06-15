'use strict';

module.exports.shouldAddVPCConfig = () => process.env.LAMBDA_SECURITY_GROUP_ID && process.env.LAMBDA_SUBNET_IDS;

module.exports.getVPCConfig = () => ({
	securityGroupIds: [process.env.LAMBDA_SECURITY_GROUP_ID],
	subnetIds: process.env.LAMBDA_SUBNET_IDS.replace(/\s/g, '').split(',')
});
