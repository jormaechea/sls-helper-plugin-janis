'use strict';

const baseHeaders = [
	'janis-api-key',
	'janis-api-secret',
	'janis-entity',
	'janis-entity-id'
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

	ImportExportAuthorizer: baseHeaders,

	ImportAuthorizer: [
		...baseHeaders,
		'janis-service'
	],
	ExportAuthorizer: baseHeaders
};
