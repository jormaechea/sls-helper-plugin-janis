'use strict';

const semverGte = require('semver/functions/gte');
const Serverless = require('serverless');

const serverless = new Serverless();
const slsVersion = serverless.getVersion();

const isLocal = process.env.JANIS_LOCAL === '1' || process.env.NODE_ENV === 'dev';

/* istanbul ignore next */
const rawBody = isLocal
	? '#set ( $rawBody = $util.escapeJavaScript($input.json(\'$\')).replaceAll("\\\'", "\\\'").replaceAll("\\n", "\\n") )'
	: '#set ( $rawBody = $util.escapeJavaScript($input.body).replaceAll("\\\'", "\\\\\'") )';

module.exports = {
	// Removing a template was implemented in serverless@1.81.0
	'application/x-www-form-urlencoded': /* istanbul ignore next */ semverGte(slsVersion, '1.81.0') ? null : '',
	'application/json': `#set( $body = $input.json("$") )
  ${rawBody}

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
    "rawBody": "$rawBody",
    "method": "$context.httpMethod",
    "principalId": "$context.authorizer.principalId",
    "stage": "$context.stage",

    #set( $map = $input.params().header )
    "headers": $loop,

    #set( $map = $input.params().querystring )
    "query": $loop,

    #set( $map = $input.params().path )
    "path": $loop,

    "identity": {
      "sourceIp": "$context.identity.sourceIp",
      "userAgent": "$context.identity.userAgent"
    },

    "authorizer": {
      "principalId": "$util.escapeJavaScript($context.authorizer.principalId).replaceAll("\\'", "'")",
      #if($context.authorizer.integrationLatency)
      "integrationLatency": "$util.escapeJavaScript($context.authorizer.integrationLatency).replaceAll("\\'", "'")",
      #end
      "janisAuth": "$util.escapeJavaScript($context.authorizer.janisAuth).replaceAll("\\'", "'")"
    },

    #set( $map = $stageVariables )
    "stageVariables": $loop,

    #set( $map = $requestContext )
    "requestContext": $loop,

    "requestPath": "$context.resourcePath"
  }
`
};
