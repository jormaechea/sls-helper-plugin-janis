'use strict';

const entityHeaders = [
	'janis-entity',
	'janis-entity-id'
];
const baseHeaders = [
	'janis-api-key',
	'janis-api-secret',
	...entityHeaders
];

const fullHeaders = [
	'janis-client',
	...baseHeaders
];

module.exports = {

	FullAuthorizer: fullHeaders,
	NoClientAuthorizer: baseHeaders,
	ClientAuthorizer: [
		'janis-client',
		...entityHeaders
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
