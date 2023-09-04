'use strict';

const transformName = (name, wordSeparator) => name.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (word, ofs) => (ofs ? wordSeparator : '') + word.toLowerCase());

const toKebabCase = name => transformName(name, '-');
const toSnakeCase = name => transformName(name, '_');

module.exports = name => {

	const titleName = `${name[0].toUpperCase()}${name.substring(1)}`;

	return {
		titleName,
		filename: toKebabCase(name).toLowerCase(),
		envVarName: toSnakeCase(name).toUpperCase(),
		sqsName: `${titleName}Queue`,
		dlqName: `${titleName}DLQ`
	};

};
