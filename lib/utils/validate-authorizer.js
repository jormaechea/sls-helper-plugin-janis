'use strict';

module.exports = ({ custom }, authorizer) => {

	if(!authorizer)
		return;

	const validAuthorizers = (custom && custom.authorizers && Object.keys(custom.authorizers)) || [];

	if(!validAuthorizers.includes(authorizer))
		throw new Error(`Invalid authorizer '${authorizer}'`);
};
