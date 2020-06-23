'use strict';

/* eslint-disable max-len */

module.exports = {
	headers: {
		'Access-Control-Allow-Credentials': "'true'",
		'Access-Control-Allow-Origin': "'*'",
		'Access-Control-Expose-Headers': "'x-janis-total'"
	},
	template: '#set($headers = $input.path("$.headers"))\n#foreach($key in $headers.keySet())\n#set($k = $util.escapeJavaScript($key))\n#set($v = $headers.get($key))\n$context.responseOverride.header.put("$k", "$v")\n#end\n#set($origin = $input.params("Origin"))\n#if(!$origin || $origin == "")#set($origin = $input.params("origin"))#end\n#if($origin && $origin != "")\n#set($context.responseOverride.header.Access-Control-Allow-Origin = $origin)\n#end\n#set($errorMessage = $input.path("$.errorMessage"))\n#if($errorMessage && $errorMessage != "")\n#set($errorMessageObj = $util.parseJson($errorMessage)){"message":"$util.escapeJavaScript($errorMessageObj.body.message),"messageVariables":#if($errorMessageObj.body.messageVariables && $errorMessageObj.body.messageVariables != "")$errorMessageObj.body.messageVariables#else{}#end"}\n#else\n#set($body = $input.json("$.body"))\n#if($body && $body != "")\n$util.parseJson($body)\n#end\n#end'
};
