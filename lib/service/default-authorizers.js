'use strict';

const baseHeaders = [
	'janis-api-key',
	'janis-api-secret'
];

const fullHeaders = [
	'janis-client',
	...baseHeaders
];

module.exports = {
	FullAuthorizer: fullHeaders,
	NoClientAuthorizer: baseHeaders,

	ClientAuthorizer: ['janis-client'],

	UserAuthorizer: fullHeaders,
	DevUserAuthorizer: fullHeaders,

	AdminAuthorizer: fullHeaders,
	AdminNoClientAuthorizer: baseHeaders,

	ServiceAuthorizer: fullHeaders,
	ServiceNoClientAuthorizer: baseHeaders,

	ImportExportAuthorizer: [
		...fullHeaders,
		'janis-service',
		'janis-entity'
	]
};
