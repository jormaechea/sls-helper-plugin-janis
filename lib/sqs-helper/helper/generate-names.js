'use strict';

module.exports = name => {

	const titleName = `${name[0].toUpperCase()}${name.substring(1)}`;

	return {
		titleName,
		sqsName: `${titleName}Queue`,
		dlqName: `${titleName}DLQ`
	};

};
