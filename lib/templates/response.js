'use strict';

/* eslint-disable max-len */

module.exports = {
	headers: {
		'Access-Control-Allow-Credentials': "'true'",
		'Access-Control-Allow-Origin': "'*'",
		'Access-Control-Expose-Headers': "'x-janis-total'"
	},
	template: '#set($headers = $input.path("$.headers"))\n#set($body = $input.json("$.body"))\n\n#set($origin = $input.params("Origin"))\n#if(!$origin || $origin == "")#set($origin = $input.params("origin"))#end\n\n#set($errorMessage = $input.path("$.errorMessage"))\n#set($statusCode = $input.path("$.statusCode"))\n\n#if($errorMessage && $errorMessage != "")\n	#set($errorMessageObj = $util.parseJson($errorMessage))\n	#if(!$statusCode || $statusCode == "")#set($statusCode = $errorMessageObj.statusCode)#end\n#end\n\n#if($statusCode && $statusCode != "")#set($context.responseOverride.status = $statusCode)#end\n\n#foreach($key in $headers.keySet())\n#set($k = $util.escapeJavaScript($key))\n#set($v = $headers.get($key))\n$context.responseOverride.header.put("$k", "$v")\n#end\n\n#if($origin && $origin != "")#set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)#end\n\n#if($errorMessageObj && $errorMessageObj != "")\n{"message":"$util.escapeJavaScript($errorMessageObj.body.message).replaceAll("\\\\\'","\'")","messageVariables": #if($errorMessageObj.body.messageVariables && $errorMessageObj.body.messageVariables != "") $errorMessageObj.body.messageVariables #else {}#end}\n#else\n#if($body && $body != "")\n$util.parseJson($body)\n#end\n#end',
	statusCodes: {
		504: {
			pattern: '([\\s\\S]*\\[504\\][\\s\\S]*)|(.*Task timed out after \\d+\\.\\d+ seconds$)',
			template: '{"message":"Timeout"}'
		}
	}
};
