'use strict';

module.exports.defaultTags = [
	{
		Key: 'Owner',
		Value: 'Janis'
	},
	{
		Key: 'Microservice',
		Value: '${self:custom.serviceName}'
	},
	{
		Key: 'Stack',
		Value: '${param:humanReadableStage}'
	}
];
