'use strict';

/* eslint-disable max-len */

const cleanTemplate = template => template.replace(/[\n\t]/g, '');

const responseTemplate = `#set($headers = $input.path("$.headers"))
#foreach($key in $headers.keySet())
	#set($k = $util.escapeJavaScript($key))
	#set($v = $headers.get($key))
	$context.responseOverride.header.put("$k", "$v")
#end

#set($origin = $input.params("Origin"))
#if(!$origin || $origin == "")
	#set($origin = $input.params("origin"))
#end
#if($origin && $origin != "")
	#set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)
#end

#set($body = $input.json("$.body"))
#set($errorMessage = $input.path("$.errorMessage"))
#set($statusCode = $input.path("$.statusCode"))
#if($errorMessage && $errorMessage != "")
	#set($errorMessageObj = $util.parseJson($errorMessage))
	#if(!$statusCode || $statusCode == "")
		#set($statusCode = $errorMessageObj.statusCode)
	#end
#end
#if($statusCode && $statusCode != "")
	#set($context.responseOverride.status = $statusCode)
#end
#if($errorMessageObj && $errorMessageObj != "")
	$errorMessageObj.body
#else
	#if($body && $body != "")
		$util.parseJson($body)
	#end
#end`;

const lambdaErrorTemplate = `#set($origin = $input.params("Origin"))
#if(!$origin || $origin == "")
	#set($origin = $input.params("origin"))
#end
#if($origin && $origin != "")
	#set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)
#end

#set($errorMessage = $input.path("$.errorMessage"))
#if($errorMessage && $errorMessage != "")
	{"message":"$errorMessage"}
#else
	{"message":"Unhandled error"}
#end`;

module.exports = {
	headers: {
		'Access-Control-Allow-Credentials': "'true'",
		'Access-Control-Allow-Origin': "'*'",
		'Access-Control-Expose-Headers': "'x-janis-total, x-janis-fixed-filters'"
	},
	template: cleanTemplate(responseTemplate),
	statusCodes: {
		500: {
			pattern: '[\\s\\S]*(Process\\s?exited\\s?before\\s?completing\\s?request|Error|Response\\s?payload\\s?size\\s?exceeded)[\\s\\S]*',
			template: cleanTemplate(lambdaErrorTemplate)
		},
		504: {
			pattern: '([\\s\\S]*\\[504\\][\\s\\S]*)|(.*Task timed out after \\d+\\.\\d+ seconds$)',
			template: '{"message":"Timeout"}'
		}
	}
};
