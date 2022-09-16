'use strict';

/* eslint-disable max-len */

module.exports = {
	headers: {
		'Access-Control-Allow-Credentials': "'true'",
		'Access-Control-Allow-Origin': "'*'",
		'Access-Control-Expose-Headers': "'x-janis-total', 'x-janis-fixed-filters'"
	},
	template: '#set($headers = $input.path("$.headers"))\n#set($body = $input.json("$.body"))\n#set($origin = $input.params("Origin"))\n#if(!$origin || $origin == "")#set($origin = $input.params("origin"))#end\n#set($errorMessage = $input.path("$.errorMessage"))\n#set($statusCode = $input.path("$.statusCode"))\n#if($errorMessage && $errorMessage != "")\n	#set($errorMessageObj = $util.parseJson($errorMessage))\n	#if(!$statusCode || $statusCode == "")#set($statusCode = $errorMessageObj.statusCode)#end\n#end\n#if($statusCode && $statusCode != "")#set($context.responseOverride.status = $statusCode)#end\n#foreach($key in $headers.keySet())\n#set($k = $util.escapeJavaScript($key))\n#set($v = $headers.get($key))\n$context.responseOverride.header.put("$k", "$v")#end\n#if($origin && $origin != "")#set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)#end\n#if($errorMessageObj && $errorMessageObj != "")\n{"message":"$util.escapeJavaScript($errorMessageObj.body.message).replaceAll("\\\\\'","\'")","messageVariables": #if($errorMessageObj.body.messageVariables && $errorMessageObj.body.messageVariables != "") $errorMessageObj.body.messageVariables #else {}#end}\n#else\n#if($body && $body != "")$util.parseJson($body)#end\n#end',
	statusCodes: {
		500: {
			pattern: '[\\s\\S]*(Process\\s?exited\\s?before\\s?completing\\s?request|\\[500\\])[\\s\\S]*',
			template: '#set($origin = $input.params("Origin"))\n#if(!$origin || $origin == "")#set($origin = $input.params("origin"))#end\n#if($origin && $origin != "")#set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)#end\n#set($errorMessage = $input.path("$.errorMessage"))\n#if($errorMessage && $errorMessage != "")\n#set($errorMessageObj = $util.parseJson($errorMessage))\n#end\n#if($errorMessageObj && $errorMessageObj != "")\n{"message":"$util.escapeJavaScript($errorMessageObj.body.message).replaceAll("\\\\\'","\'")","messageVariables": #if($errorMessageObj.body.messageVariables && $errorMessageObj.body.messageVariables != "") $errorMessageObj.body.messageVariables #else {}#end}\n#else\n{"message":"Unhandled error"}\n#end'
		},
		504: {
			pattern: '([\\s\\S]*\\[504\\][\\s\\S]*)|(.*Task timed out after \\d+\\.\\d+ seconds$)',
			template: '{"message":"Timeout"}'
		}
	}
};
