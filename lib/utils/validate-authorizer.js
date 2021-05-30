'use strict';

module.exports = ({ custom }, authorizer) => {

	if(!authorizer)
		return;

	if(!custom || !custom.authorizers || !custom.authorizers[authorizer])
		throw new Error(`Invalid authorizer '${authorizer}'`);
};
