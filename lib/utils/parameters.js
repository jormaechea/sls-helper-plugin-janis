'use strict';

const pathParameterRegex = new RegExp('{([a-z0-9_-]+)}', 'ig');

const getPathParameters = path => {
	const matches = path.match(pathParameterRegex);

	if(!matches)
		return;

	return matches.reduce((acum, match) => {
		return {
			...acum,
			[match.replace(/[{}]/g, '')]: true
		};
	}, {});
};

module.exports = {
	getPathParameters
};
