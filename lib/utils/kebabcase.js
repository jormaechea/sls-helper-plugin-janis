'use strict';

module.exports = str => {
	return str.trim()
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/\W/g, m => (/[À-ž]/.test(m) ? m : '-'))
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')
		.toLowerCase();
};
