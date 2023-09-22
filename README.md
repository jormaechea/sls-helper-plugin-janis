# Serverless Helper Plugin JANIS

A plugin for JANIS Commerce to use with the [Serverless Helper Framework](http://npmjs.com/package/sls-helper).

<a href="https://www.npmjs.com/package/sls-helper-plugin-janis">
	<img src="https://badge.fury.io/js/sls-helper-plugin-janis.svg" alt="npm version" />
</a>

<a href="https://github.com/jormaechea/sls-helper-plugin-janis/actions?query=workflow%3A%22Build+Status%22">
	<img src="https://github.com/jormaechea/sls-helper-plugin-janis/workflows/Build%20Status/badge.svg" alt="Build status" />
</a>

<a href="https://github.com/jormaechea/sls-helper-plugin-janis/actions?query=workflow%3A%22Coverage+Status%22">
	<img src="https://github.com/jormaechea/sls-helper-plugin-janis/workflows/Coverage%20Status/badge.svg" alt="Coverage Status" />
</a>

## Helpers

### base

Used to implement a base service with minimal setup

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| serviceCode | string | The service name in lowercase dash separated | **Required** | |
| servicePort | number | The service port | **Required** | |
| apiSecrets | Object | A mapping of stages to Service API Secret | | `undefined` |

Some properties of the initial configuration have a new special meaning:

#### package.include and package.includeOnly
#### package.exclude and package.excludeOnly
#### package.plugins and package.pluginsOnly

This properties (if present in the initial service configuration) have the following behavior:
- `package.include`, `package.exclude` and `plugins` will be appended to the hooks defaults
- `package.includeOnly`, `package.excludeOnly` and `pluginsOnly` will replace entirely the hooks defaults

#### Trace Lambda Layer

If the env vars `TRACE_ACCOUNT_ID` and `JANIS_TRACE_EXTENSION_VERSION` are set, the Trace Lambda Layer will be set for every function by default.

> `apiGet` and `apiList` are the only functions that have this behaviour changed by default.

To disable the layer, see the `skipTraceLayer` property in other helpers.

### templates

Used to implement Lambda APIs requests and response templates as custom props

_No options_

### authorizers

Used to implement APIs authorizers as custom props

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| accountId | string | Indicates the AWS account ID where the authorizers are deployed | **Required** | |

### cors

Used to implement APIs CORS configuration as custom props

If options is `undefined` or set to `true` it will use the default CORS config for every property.
You can also customize or override every property:

| Option | Type | Description | Default value |
|--------|------|-------------|---------------|
| replace | boolean | Indicates whether it should replace the CORS properties or merge then with the default | false |
| origins | array\<string\> | An array of allowed origins | ['*'] |
| headers | array\<string\> | An array of allowed headers | [See below](#cors-default-headers) |
| allowCredentials | boolean | Indicates whether the credentials header should be set | `true` |
| maxAge | number | The time in seconds thar CORS headers should be cached | 600 |

#### CORS Default headers:
```
[
	'authorization',
	'content-type',
	'janis-api-key',
	'janis-api-secret',
	'janis-client',
	'janis-service',
	'janis-entity',
	'x-api-key',
	'x-janis-totals',
	'x-janis-only-totals',
	'x-janis-page',
	'x-janis-page-size'
]
```

### api

Used to implement a custom API

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| functionName | string | The name of the lambda function. Will be used in `API-{serviceName}-{functionName}-{stage}`. Since _5.6.0_ | | |
| path | string | The API path | **Required** | |
| method | string | The API HTTP Method | | `'get'` |
| methodName | string | The JANIS API Method | Enum\<list, get, post, put, patch, delete\> | Defaults to same value of `method` option |
| handler | string | The lambda handler path and function | | `'src/lambda/RestApi/index.handler'` |
| caching | boolean | Set to `true` to enable cache | | `false` |
| cors | boolean|object | Set to `true` to enable services default **CORS**, or configure as an object as explained in **CORS** to customize the API CORS | | `false` |
| queryParameters | object | A key value to map query string parameters to a boolean indicating if it's required or not | | |
| requestTemplates | object | A key value to map content types to request mapping headers. By default only `application/json` is enabled ([Docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway#request-templates)) | | |
| requestHeaders | object | A key value to map headers to a boolean indicating if it's required or not | | |
| authorizer | string | The name of the authorizer | | |
| timeout | number | The function timeout in seconds | | |
| package.include | array[string] | The List of paths of files to include | | |
| skipTraceLayer | boolean | Set to `true` if the API should not use the [Trace Lambda Layer](#trace-lambda-layer) | | `false` |
| functionRawProps | object | Custom properties to set in the function configuration | | |
| eventRawProps | object | Custom properties to set in the event configuration | | |

### apiList, apiGet, apiPost and apiPut

Used to implement JANIS CRUD APIs.

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| functionName | string | The name of the lambda function. Will be used in `API-{serviceName}-{functionName}-{stage}`. Since _5.6.0_ | | |
| entityName | string | The entity name | **Required** | |
| handler | string | The lambda handler path and function | | `'src/lambda/RestApi/index.handler'` |
| path | string | The API path | | `/[entity-name]` (for apiList and apiPost) or `/[entity-name]/{id}` (for apiGet and apiPut) |
| caching | boolean | Set to `true` to enable cache | | `false` |
| cors | boolean|object | Set to `true` to enable services default **CORS**, or configure as an object as explained in **CORS** to customize the API CORS | | `false` |
| queryParameters | object | A key value to map query string parameters to a boolean indicating if it's required or not | | |
| requestTemplates | object | A key value to map content types to request mapping headers. By default only `application/json` is enabled ([Docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway#request-templates)) | | |
| requestHeaders | object | A key value to map headers to a boolean indicating if it's required or not | | |
| authorizer | string | The name of the authorizer | | |
| timeout | number | The function timeout in seconds | | |
| package.include | array[string] | The List of paths of files to include | | |
| skipTraceLayer | boolean | Set to `true` if the API should not use the [Trace Lambda Layer](#trace-lambda-layer) | | `false` for `post` and `put` APIs, `true` for `get` and `list` APIs |
| functionRawProps | object | Custom properties to set in the function configuration | | |
| eventRawProps | object | Custom properties to set in the event configuration | | |

### eventListener

Used to implement JANIS Events listeners

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| serviceName | string | The service name | **Required** | |
| entityName | string | The entity name | **Required** | |
| eventName | string | The event name | **Required** | |
| mustHaveClient | boolean | Indicates if authorizer must validate that client or not | | `false` |
| listenersDirName | string | Indicates the path where the event listener files are placed | | `'event-listeners'` |
| authorizer | string | The name of the authorizer | | If not set, it defaults to `ServiceAuthorizer` or `ServiceNoClientAuthorizer` based on the value of `mustHaveClient` |
| package.include | array[string] | The List of paths of files to include |
| timeout | number | The function timeout in seconds | | |
| functionRawProps | object | Custom properties to set in the function configuration | | |

### dbConfig

_(since 3.1.0)_

Used to implement JANIS Database config as secret with an auto-generated password

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| secret | string \| object | The secret content as an object or a JSON stringified object | **Required** | |
| secretName | string | The secret name | | `'janis/${self:custom.serviceCode}/${self:custom.stage}/db-config'` |
| description | string | The secret description | | `'Database config secret for janis ${self:custom.serviceCode} ${self:custom.stage}'` |
| passwordKey | string | The property name where the password will be generated | | `'password'` |
| passwordLength | number | The generated password length | | `40` |

### stateMachine

_(since 4.3.0)_

Used to implement AWS State Machines

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| name | string | The name of the state machine | **Required** | |
| definition | object | The definition of the state machine. See more [Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-state-machine-structure.html)| **Required**  | |

It will automatically include the `serverless-step-functions` plugin.

It also defines 2 properties in the `custom` namespace:

- `custom.machines.{MachineName}.arn`: The State Machine ARN
- `custom.machines.{MachineName}.name`: The State Machine Name

**Important:** The `{MachineName}` in the `custom.machines` path will replaced be the `name` property converted to [PascalCase](http://wiki.c2.com/?PascalCase).
For example, if the following hook is  configured

```js
['janis.stateMachine', {
	name: 'my-super-machine',
	definition: myDefinition
}]
```

The following custom props will be set: `custom.machines.MySuperMachine.arn` and `custom.machines.MySuperMachine.name`

## Examples

### Basic Service with one CRUD operation set and an event listener

```js
// serverless.js

'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line

module.exports = helper({
	hooks: [

		['janis.base', {
			serviceCode: 'my-service',
			servicePort: 5000,
			apiSecrets: {
				beta: 'foo',
				qa: 'bar',
				prod: 'baz'
			}
		}],

		'janis.templates',

		['janis.authorizers', {
			accountId: '012345678910'
		}],

		'janis.cors',

		['janis.api', {
			path: '/hello-world',
			authorizer: 'NoClientAuthorizer',
			cors: true
		}],

		['janis.apiList', {
			entityName: 'product',
			authorizer: 'FullAuthorizer',
			cors: true
		}],

		['janis.apiGet', {
			entityName: 'product',
			authorizer: 'FullAuthorizer',
			cors: true
		}]

		['janis.apiPost', {
			entityName: 'product',
			authorizer: 'FullAuthorizer',
			cors: true
		}],

		['janis.apiPut', {
			entityName: 'product',
			authorizer: 'FullAuthorizer',
			cors: true
		}],

		['janis.apiList', {
			entityName: 'otherEntity',
			authorizer: 'FullAuthorizer',
			cors: {
				origins: ['*'], // Open to every origin
				allowCredentials: false
			}
		}],

		['janis.eventListener', {
			serviceName: 'catalog',
			entityName: 'product',
			eventName: 'created',
			mustHaveClient: true
		}],

		['janis.stateMachine', {
			name: 'StateMachineName',
			definition: {
				Comment: 'State Machine Comment',
				StartAt: 'WaitForCall',
				States: {
					WaitForCall: {
						Type: 'Wait',
						SecondsPath: '$.body.wait',
						Next: 'Finish'
					}
				}
			}
		}]

	]
}, {});
```