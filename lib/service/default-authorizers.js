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
	ClientAuthorizer: [
		'janis-client'
	],

	LoggedAuthorizer: baseHeaders,
	ApiKeyAuthorizer: baseHeaders,
	UserAuthorizer: baseHeaders,
	DevUserAuthorizer: baseHeaders,
	AdminAuthorizer: fullHeaders,
	AdminNoClientAuthorizer: baseHeaders,

	ServiceAuthorizer: fullHeaders,
	ServiceNoClientAuthorizer: baseHeaders,

	ImportExportAuthorizer: [
		...baseHeaders,
		'janis-entity'
	],
	ImportAuthorizer: [
		...baseHeaders,
		'janis-service',
		'janis-entity'
	],
	ExportAuthorizer: [
		...baseHeaders,
		'janis-entity'
	]
};
