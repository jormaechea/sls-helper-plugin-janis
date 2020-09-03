'use strict';

const semverGte = require('semver/functions/gte');
const Serverless = require('serverless');

const serverless = new Serverless();
const slsVersion = serverless.getVersion();

module.exports = {
	// Removing a template was implemented in serverless@1.81.0
	'application/x-www-form-urlencoded': /* istanbul ignore next */ semverGte(slsVersion, '1.81.0') ? null : '',
	'application/json': `#set( $body = $input.json("$") )

  #define( $loop )
  {
    #foreach($key in $map.keySet())
    #set( $k = $util.escapeJavaScript($key) )
    #set( $v = $util.escapeJavaScript($map.get($key)).replaceAll("\\'", "'") )
    "$k":
    "$v"
    #if( $foreach.hasNext ) , #end
    #end
  }
  #end

  {
    "body": $body,
    "method": "$context.httpMethod",
    "principalId": "$context.authorizer.principalId",
    "stage": "$context.stage",

    #set( $map = $input.params().header )
    "headers": $loop,

    #set( $map = $input.params().querystring )
    "query": $loop,

    #set( $map = $input.params().path )
    "path": $loop,

    #set( $map = $context.authorizer )
    "authorizer": $loop,

    #set( $map = $stageVariables )
    "stageVariables": $loop,

    #set( $map = $requestContext )
    "requestContext": $loop,

    "requestPath": "$context.resourcePath"
  }
`
};
