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
| params | { [env]: { [param]: value } } | A mapping of param name and value by environment. Well known environments are: `local`, `beta`, `qa` and `prod`, but any other env will be kept | | The params `humanReadableStage` and `janisDomain` are defined for each well-known env. |

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

Used to implement APIs authorizers as custom props.

Using the env var `AUTHORIZER_ACCOUNT_ID` that indicates the AWS account ID where the authorizers are deployed. **Required**.

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
| layers | array[object] | An array of function-level layers. This will override any provider-level layers, except for the Trace Layer. Use together with `skipTraceLayer` to remove the Trace layer _(since 8.2.0)_ | | |
| addLayers | array[object] | An array of function-level layers. This will be appended to any provider-level layers _(since 8.2.0)_ | | |
| skipTraceLayer | boolean | Set to `true` if the API should not use the [Trace Lambda Layer](#trace-lambda-layer) | | `false` |
| handler | string | The lambda handler path and function | | `'src/lambda/RestApi/index.handler'` |
| caching | boolean | Set to `true` to enable cache | | `false` |
| cors | boolean|object | Set to `true` to enable services default **CORS**, or configure as an object as explained in **CORS** to customize the API CORS | | `false` |
| queryParameters | object | A key value to map query string parameters to a boolean indicating if it's required or not | | |
| requestTemplates | object | A key value to map content types to request mapping headers. By default only `application/json` is enabled ([Docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway#request-templates)) | | |
| requestHeaders | object | A key value to map headers to a boolean indicating if it's required or not | | |
| authorizer | string | The name of the authorizer | | |
| timeout | number | The function timeout in seconds | | |
| package.include | array[string] | The List of paths of files to include | | |
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
| layers | array[object] | An array of function-level layers. This will override any provider-level layers, except for the Trace Layer. Use together with `skipTraceLayer` to remove the Trace layer _(since 8.2.0)_ | | |
| addLayers | array[object] | An array of function-level layers. This will be appended to any provider-level layers _(since 8.2.0)_ | | |
| skipTraceLayer | boolean | Set to `true` if the API should not use the [Trace Lambda Layer](#trace-lambda-layer) | | `false` for `post` and `put` APIs, `true` for `get` and `list` APIs |
| caching | boolean | Set to `true` to enable cache | | `false` |
| cors | boolean|object | Set to `true` to enable services default **CORS**, or configure as an object as explained in **CORS** to customize the API CORS | | `false` |
| queryParameters | object | A key value to map query string parameters to a boolean indicating if it's required or not | | |
| requestTemplates | object | A key value to map content types to request mapping headers. By default only `application/json` is enabled ([Docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway#request-templates)) | | |
| requestHeaders | object | A key value to map headers to a boolean indicating if it's required or not | | |
| authorizer | string | The name of the authorizer | | |
| timeout | number | The function timeout in seconds | | |
| package.include | array[string] | The List of paths of files to include | | |
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
| layers | array[object] | An array of function-level layers. This will override any provider-level layers, except for the Trace Layer. Use together with `skipTraceLayer` to remove the Trace layer _(since 8.2.0)_ | | |
| addLayers | array[object] | An array of function-level layers. This will be appended to any provider-level layers _(since 8.2.0)_ | | |
| skipTraceLayer | boolean | Set to `true` if the API should not use the [Trace Lambda Layer](#trace-lambda-layer) _(since 8.2.0)_ | | `false` |
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
| type | string | The [type of workflow](https://www.serverless.com/plugins/serverless-step-functions#express-workflow) of the state machine. | Enum\<`STANDARD`,`EXPRESS`\> | `STANDARD` |
| loggingConfig | boolean\|string\|object | The Cloudwatch Logging Configuration of the state machine. | If not set, logging will be OFF. <br/> If set to `true`, logging will be set to `INFO` and a default Log Group will be created. <br/> If set as `string`, it will be used as log level and a default Log Group will be created. <br/> If set as an `object`, it will be used as is (a default  Log Group will be created if `destinations` property is not set) <br/><br/> See [loggingConfig documentation](https://www.serverless.com/plugins/serverless-step-functions#cloudwatch-logs) for full configuration options. | |
| rawProperties | object | A free form object to set any property supported by the [Step Functions Plugin](https://www.serverless.com/plugins/serverless-step-functions) but not supported by this package. | |

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

### functionsVpc

_(since 7.1.0)_

Used to attach the service to a VPC with a Custom Security Group

**Important:** This hook MUST be set after declaring every function of the service. If a function is declared after this hook, it won't be attached to the VPC.

| Option | Type | Description | Attributes | Default value |
|--------|------|-------------|------------|---------------|
| vpcId | string | The ID of the VPC, for example `vpc-11111111`. If this is not set, VPC will not be attached. | | |
| subnetIds | string[] | The IDs of the Subnets, for example `subnet-111111111`. If this is not set or is empty, VPC will not be attached. | | |

It will automatically create a Security Group in the given VPC and attach it to every lambda function. The logical name of the SG will be `ServiceSecurityGroup`. It can be overriden using [Serverless resource overrides](https://www.serverless.com/framework/docs/providers/aws/guide/resources#override-aws-cloudformation-resource).


```js
['janis.functionsVpc', {
	vpcId: 'vpc-11111111',
	subnetIds: [
		'subnet-111111111',
		'subnet-222222222'
	]
}]
```

### VPC Configuration

_(since 8.0.0)_

If the env vars `LAMBDA_SECURITY_GROUP_ID` and `LAMBDA_SUBNET_IDS` are set, the global VPC configuration for **all functions** added in the service will be added in `provider`.

See more [VPC Configuration](https://www.serverless.com/framework/docs/providers/aws/guide/functions#vpc-configuration)

```js
process.env.LAMBDA_SECURITY_GROUP_ID = 'sg-abcdef0001';
process.env.LAMBDA_SUBNET_IDS = 'subnet-111111111,subnet-222222222';
```

### Function URL

This plugin is used to create Lambda functions with customized domains. The domain structure follows the format `${customSubdomain}.${hostedZone}/{customPath}`.

**Important:**
- This hook links **existing** Lambda functions with custom domains. It means referenced Functions must be defined before this hook.
- The `hostedZone` name is obtained from `${self:custom.customDomain.lambdaUrlDomainName}`. If it is not defined, the value of `${self:custom.customDomain.domainName}` will be used instead.


| Option | Type | Description |
|--------|------|-------------|
| subdomainName | string | Subdomain to prepend to Service domain name (defined as a custom property for each service). | |
| acmCertificate | string | AWS's ACM Certificate Id valid for defined subdomain.| |
| functions | Array{} | Array of objects with path definitions for the subdomain. <br/> <br/>* ***The first referenced function will be set as the default for requests with no path.*** | |
| functions.0.functionName | string | Name of the function being referenced. <br/> <br/> * ***In order to be valid, referenced Functions must be defined as Lambdas Url***.                                                  |
| functions.0.path | string | Relative path associated with the function. <br/> <br/> * ***Use '*' to redirect all requests with that specific path and any additional subpaths to that specific function***                                                                      |

It will automatically create (or update) a Cloudfront Distribution and a Route 53 Record Set.


```js
[
	"janis.functionUrl",
	{
		"subdomainName": "subSubdomain.subdomain",
		"acmCertificate": "${param:acmCertificateId}",
		"functions": [
			{
				"functionName": "CustomUrlLambda",
				"path": "/customUrl/*"
			},
			{
				"functionName": "CustomUrlLambda2",
				"path": "/customUrl2/"
			}
		]
	}
]
```
> Expected URLs to access CustomUrlLambda: `https://subSubdomain.subdomain.{HostedZoneName}/customUrl`.
`https://subSubdomain.subdomain.{HostedZoneName}/customUrl/subpath`

> Expected URL to access CustomUrlLambda2: `https://subSubdomain.subdomain.{HostedZoneName}/customUrl2`

## :new: Hook Builders Helpers

This kind of Helpers aren't hooks, this helpers builds hooks (normally many of them) that together make available some kind of resource.

> This helpers exist to create some kind of standard and re-utilize another hooks

### SQS Helper

This helpers must be used to create SQS resources and consumers with minimal data to a full customization.

#### Require Helpers

Unlike to normal Hooks, they must be explicitly required from the package.

```js
const { SQSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

```

#### Permissions

To use SQS resources, AWS permissions must be added, in order to make it easier, you can get them from the Helper using `SQSHelper.sqsPermissions` getter.

#### Build Hook

To use the hook Builder of:

- SQS Queue
- Delay Queue (optional). Since _9.7.0_
- DLQ Queue
- Main Consumer
- Delay Consumer (optional). Since _9.7.0_
- DLQ Consumer (optional)
- Env Vars for SQS Urls

You can use `SQSHelper.buildHooks(configs)` method. This will create an _array_ of Hooks with the proper data.

**Parameters**
- `configs`: _Object_
	- `name`: **REQUIRED** | _String_ | The name of SQS, it will be used for every resource. It must be not empty and _camelCase_ to avoid issues creating the resources names.
	- `mainQueueProperties`: **OPTIONAL** _Object_ | If it is not passed, it will use _default_ data.
	- `consumerProperties`: **OPTIONAL** | _Object_ | If it is not passed, it will use _default_ data.
	- `delayConsumerProperties`: **OPTIONAL** | _Object_ | If it is not passed, it will use _default_ data when `delayQueueProperties` received.
	- `delayQueueProperties`: **OPTIONAL** _Object_ | If it is not passed, wont be created.
	- `dlqQueueProperties`: **OPTIONAL** _Object_ | If it is not passed, it will use _default_ data.
	- `dlqConsumerProperties`: **OPTIONAL** | _Object_ | By default the DLQ consumer **won't be created**, you must pass values to create it.
	- `sourceSnsTopic`: **OPTIONAL** | _Object_ | The configuration of an SNS Topic to which the queue will be subscribed to. (See [SNSHelper](#sns-helper) to know how to create an SNS Topic)

> Only with a name can create everything except for the Delay hooks (queue and consumer) and DLQ Consumer function

**Consumer Properties**:
All `consumerProperties`, `delayConsumerProperties` and `dlqConsumerProperties` fields can be customized with the following properties:

- `timeout`: _default_: 15 | Change the Function timeout (in seconds).
- `handler`: _default_: `src/sqs-consumer/[name in lowerCase]-consumer.handler` | Change the location of the file.
- `description`: _default_: `[name] SQS Queue Consumer` | Change the function description.
- `batchSize`: _default_: 1 (only for main consumer) | Change the SQS consumer batch Size.
- `maximumBatchingWindow`: _default_: 10 (only for main consumer) | Change the SQS consumer maximum batching window.
- `prefixPath`: _String_: To add optional prefix path after `src/sqs-consumer`. e.g. `src/sqs-consumer/[prefixPath]/[name in lowerCase]-consumer.handler`

Some other properties
- `functionProperties`: _Object_ | To add other properties to the function (the same one in `function` hook).
- `rawProperties`: _Object_ | To add rawProperties to the function for example changed a `DependsOn`.
- `eventProperties`: _Object_ | To add extra Properties to the sqs event configuration, for example `functionResponseType`

Delay Consumer and DLQ Consumer properties
- `useMainHandler`: _boolean_ | To use the main consumer and not creating other function.

**Queue Properties**:
All `mainQueueProperties`, `delayQueueProperties` and `dlqQueueProperties` fields can be customized with the following properties:

- `maxReceiveCount`: _default_: 5 (only for MainQueue and DelayQueue) | Change the max receive count properties before sent the message to DelayQueue or DLQ.
- `receiveMessageWaitTimeSeconds`: _default_: 20 (MainQueue and DelayQueue) or 5 (DLQ).
- `visibilityTimeout`: _default_: 60 (MainQueue and DelayQueue) or 20 (DLQ).
- `messageRetentionPeriod`: _default_: 864000 (only for DLQ).
- `delaySeconds`: _default_: 300 (only for DelayQueue).
- `addTags`: _object array_: To add Tags for queues. The AWS tag format is `[{ Key: 'myTag', Value: 'theTagValue' }]`.
- `generateEnvVars`: _boolean_ | If set to true, the environment variables with the SQS url will be generated. The default will be `true` only for SQS queues.

FIFO properties (since _9.6.0_)
- `fifoQueue`: _boolean_ | If set to `true`, creates a FIFO queue.
- `contentBasedDeduplication`: _boolean_ | Specifies whether to enable content-based deduplication.
- `fifoThroughputLimit`: _string_ | Valid values are `perQueue` and `perMessageGroupId`.
- `deduplicationScope`: _string_ | Valid values are `queue` and `messageGroup`.

**Source SNS Topic**
The `sourceSnsTopic` parameter has the following structure:
- `name` **REQUIRED** The name of the SNS Topic
- `filterPolicy` **OPTIONAL** An object defining a [SNS Subscription Policy](https://docs.aws.amazon.com/sns/latest/dg/sns-subscription-filter-policies.html) to apply. The policy will be applied to the messages attributes scope, not to the event payload.

**Returns**: _array_ of Hooks

#### Consumer Files

If handler's location don't change (uses default values), the files must be located in

* `src/sqs-consumer/[name-in-kebab-case]-consumer.js` for main queue consumer
* `src/sqs-consumer/[name-in-kebab-case]-delay-consumer.js` for delay consumer
* `src/sqs-consumer/[name-in-kebab-case]-dlq-consumer.js` for dlq consumer

If `prefixPath` received the location will be

* `src/sqs-consumer/[prefixPath]/[name-in-kebab-case]-consumer.js` for main queue consumer
* `src/sqs-consumer/[prefixPath]/[name-in-kebab-case]-delay-consumer.js` for delay consumer
* `src/sqs-consumer/[prefixPath]/[name-in-kebab-case]-dlq-consumer.js` for dlq consumer

#### SQS URL Env Vars

Environment Variables will be created for SQS URL if the property `generateEnvVars` of each queue is set as true (for main queues, `generateEnvVars` defaults to `true`):

* `[NAME_IN_SNAKE_CASE]_SQS_QUEUE_URL` for main queue
* `[NAME_IN_SNAKE_CASE]_DELAY_QUEUE_URL` for delay queue (when `delayQueueProperties` received)
* `[NAME_IN_SNAKE_CASE]_DLQ_SQS_QUEUE_URL` for dlq

> FIFO queues uses the same Environment Variables as Standard queues.

**Disable Global env vars**

As service grows, the environment variable size quota is reached and breaks service deployments. To avoid it, global env vars can be disabled, and Queue URL env vars can be set in a per-function basis.

To do so, you can use `SQSHelper.shouldSetGlobalEnvVars(false)` method (by default, global env vars are enabled).

Once disabled, you MUST set the variables to each Lambda function that needs them using `SQSHelper.getEnvVar(queueName)`, for example:

```js
const { helper } = require('sls-helper'); // eslint-disable-line
const { SQSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

// ...

SQSHelper.shouldSetGlobalEnvVars(false);

module.exports = helper({
	hooks: [
		// other hooks

		// Permissions must be applied once
		SQSHelper.sqsPermissions

		// must spread it
		...SQSHelper.buildHooks({ name: 'SessionEnded' }),

		['function', {
			functionName: 'EndSession',
			handler: 'src/lambda/Session/End.handler',
			rawProperties: {
				environment: {
					...SQSHelper.getEnvVar('SessionEnded')
				}
			}
		}],

		[['janis.api',
			{
				path: '/session/{id}/end',
				method: 'post',
				cors: true,
				functionRawProps: {
					environment: {
						...SQSHelper.getEnvVar('SessionEnded')
					}
				}
			}
		]]
	]
});
```

#### Quick hook example

```js
const { helper } = require('sls-helper'); // eslint-disable-line
const { SQSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

// ...

module.exports = helper({
	hooks: [
		// other hooks

		// Permissions must be applied once
		SQSHelper.sqsPermissions

		// must spread it
		...SQSHelper.buildHooks({ name: 'SessionEnded' })
	]
});

/*

Creates the following Hooks
// For permissions

	['iamStatement', {
		action: [
			'sqs:SendMessage',
			'sqs:DeleteMessage',
			'sqs:ReceiveMessage',
			'sqs:GetQueueAttributes'
		],
		// eslint-disable-next-line no-template-curly-in-string
		resource: 'arn:aws:sqs:${aws:region}:${aws:accountId}:*'
	}]

// For Env Vars

	['envVars', {
		SESSION_ENDED_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}SessionEndedQueue',
		SESSION_ENDED_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}SessionEndedDLQ'
	}]

// For SQS Consumer

	['function', {
		functionName: 'SessionEndedQueueConsumer',
		handler: 'src/sqs-consumer/session-ended-consumer.handler',
		description: 'SessionEnded SQS Queue Consumer',
		timeout: 15,
		rawProperties: {
			dependsOn: ['SessionEndedQueue']
		},
		events: [
			{
				sqs: {
					arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}SessionEndedQueue',
					batchSize: 1,
					maximumBatchingWindow: 10
				}
			}
		]
	}]

// For SQS Resources

	['resource', {
		name: 'SessionEndedQueue',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}SessionEndedQueue',
				ReceiveMessageWaitTimeSeconds: 20,
				VisibilityTimeout: 60,
				// eslint-disable-next-line max-len
				RedrivePolicy: '{"maxReceiveCount": 5, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}SessionEndedDLQ"}'
			},
			DependsOn: ['SessionEndedDLQ']
		}
	}]

	['resource', {
		name: 'SessionEndedDLQ',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}SessionEndedDLQ',
				ReceiveMessageWaitTimeSeconds: 5,
				VisibilityTimeout: 20,
				MessageRetentionPeriod: 864000
			}
		}
	}]
*/

```

#### With DLQ Consumer example

```js

const { helper } = require('sls-helper'); // eslint-disable-line
const { SQSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

// ...

module.exports = helper({
	hooks: [
		// other hooks

		SQSHelper.sqsPermissions

		// must be spread
		...SQSHelper.buildHooks({
			name: 'SessionEnded',
			dlqConsumerProperties: {
				timeout: 30,
				batchSize: 10,
				maximumBatchingWindow: 100
			}
		})
	]
});

/*

Creates the following Hooks

// For permissions

	['iamStatement', {
		action: [
			'sqs:SendMessage',
			'sqs:DeleteMessage',
			'sqs:ReceiveMessage',
			'sqs:GetQueueAttributes'
		],
		// eslint-disable-next-line no-template-curly-in-string
		resource: 'arn:aws:sqs:${aws:region}:${aws:accountId}:*'
	}]

// For Env Vars

	['envVars', {
		SESSION_ENDED_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}SessionEndedQueue',
		SESSION_ENDED_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}SessionEndedDLQ'
	}]

// For SQS Consumers

	['function', {
		functionName: 'SessionEndedQueueConsumer',
		handler: 'src/sqs-consumer/session-ended-consumer.handler',
		description: 'SessionEnded SQS Queue Consumer',
		timeout: 15,
		rawProperties: {
			dependsOn: ['SessionEndedQueue']
		},
		events: [
			{
				sqs: {
					arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}SessionEndedQueue',
					batchSize: 1,
					maximumBatchingWindow: 10
				}
			}
		]
	}]

	['function', {
		functionName: 'SessionEndedDLQQueueConsumer',
		handler: 'src/sqs-consumer/session-ended-dlq-consumer.handler',
		description: 'SessionEndedDLQ SQS Queue Consumer',
		timeout: 30,
		rawProperties: {
			dependsOn: ['SessionEndedDLQ']
		},
		events: [
			{
				sqs: {
					arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}SessionEndedDLQ',
					batchSize: 10,
					maximumBatchingWindow: 100
				}
			}
		]
	}]

// For SQS Resources

	['resource', {
		name: 'SessionEndedQueue',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}SessionEndedQueue',
				ReceiveMessageWaitTimeSeconds: 20,
				VisibilityTimeout: 60,
				// eslint-disable-next-line max-len
				RedrivePolicy: '{"maxReceiveCount": 5, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}SessionEndedDLQ"}'
			},
			DependsOn: ['SessionEndedDLQ']
		}
	}]

	['resource', {
		name: 'SessionEndedDLQ',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}SessionEndedDLQ',
				ReceiveMessageWaitTimeSeconds: 5,
				VisibilityTimeout: 20,
				MessageRetentionPeriod: 864000
			}
		}
	}]
*/

```

#### Delay Queue using main consumer example

```js

const { helper } = require('sls-helper'); // eslint-disable-line
const { SQSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

// ...

module.exports = helper({
	hooks: [
		// other hooks

		SQSHelper.sqsPermissions

		// must be spread
		...SQSHelper.buildHooks({
			name: 'ProcessStock',
			consumerProperties: {
				batchSize: 100,
				maximumBatchingWindow: 60,
				eventProperties: { maximumConcurrency: 5 }
			}
			delayQueueProperties: {
				// this delay the process
				visibilityTimeout: 600
			},
			delayConsumerProperties: {
				// same process as main consumer
				useMainHandler: true,
				batchSize: 50,
				maximumBatchingWindow: 30,
				eventProperties: { maximumConcurrency: 1 }
			}
		})
	]
});

/*

Creates the following Hooks

// For permissions

	['iamStatement', {
		action: [
			'sqs:SendMessage',
			'sqs:DeleteMessage',
			'sqs:ReceiveMessage',
			'sqs:GetQueueAttributes'
		],
		// eslint-disable-next-line no-template-curly-in-string
		resource: 'arn:aws:sqs:${aws:region}:${aws:accountId}:*'
	}]

// For Env Vars

	['envVars', {
		PROCESS_STOCK_SQS_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}ProcessStockQueue',
		PROCESS_STOCK_DLQ_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}ProcessStockDLQ',
		PROCESS_STOCK_DELAY_QUEUE_URL: 'https://sqs.${aws:region}.amazonaws.com/${aws:accountId}/${self:custom.serviceName}ProcessStockDelayQueue'
	}]

// For SQS Consumers

	['function', {
		functionName: 'ProcessStockQueueConsumer',
		handler: 'src/sqs-consumer/process-stock-consumer.handler',
		description: 'ProcessStock SQS Queue Consumer',
		timeout: 15,
		rawProperties: {
			dependsOn: ['ProcessStockQueue']
		},
		events: [
			{
				sqs: {
					arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}ProcessStockQueue',
					batchSize: 100,
					maximumBatchingWindow: 60,
					maximumConcurrency: 5
				}
			}, {
				sqs: {
					arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}ProcessStockDelayQueue',
					batchSize: 50,
					maximumBatchingWindow: 30,
					maximumConcurrency: 1
				}
			}
		]
	}]

// For SQS Resources

	['resource', {
		name: 'ProcessStockQueue',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}ProcessStockQueue',
				ReceiveMessageWaitTimeSeconds: 20,
				VisibilityTimeout: 60,
				// eslint-disable-next-line max-len
				RedrivePolicy: '{"maxReceiveCount": 5, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}ProcessStockDelayQueue"}'
			},
			DependsOn: ['ProcessStockDelayQueue']
		}
	}],

	['resource', {
		name: 'ProcessStockDelayQueue',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}ProcessStockDelayQueue',
				ReceiveMessageWaitTimeSeconds: 20,
				VisibilityTimeout: 600,
				DelaySeconds: 300,
				// eslint-disable-next-line max-len
				RedrivePolicy: '{"maxReceiveCount": 5, "deadLetterTargetArn": "arn:aws:sqs:${aws:region}:${aws:accountId}:${self:custom.serviceName}ProcessStockDLQ"}'
			},
			DependsOn: ['ProcessStockDLQ']
		}
	}],

	['resource', {
		name: 'ProcessStockDLQ',
		resource: {
			Type: 'AWS::SQS::Queue',
			Properties: {
				QueueName: '${self:custom.serviceName}ProcessStockDLQ',
				ReceiveMessageWaitTimeSeconds: 5,
				VisibilityTimeout: 20,
				MessageRetentionPeriod: 864000
			}
		}
	}]
*/

```

### SNS Helper

This helpers must be used to create SNS resources and subscribers with minimal data to a full customization.

#### Require Helpers

Unlike to normal Hooks, they must be explicitly required from the package.

```js
const { SNSHelper } = require('sls-helper-plugin-janis');
```

#### Permissions

SNS Permissions are automatically created when creating a topic, you don't need to do nothing else :sparkles:

#### Build Hook

To create a new SNS Topic, you just have to call the `SNS.buildHooks(config: SNSConfig)` method with the proper configuration object.

**Types**

You can see `SNSConfig` and their properties in the [types definition](lib/sns-helper/types/config.ts)

> Only with a topic name you are ready to go

#### SNS ARN Env Vars

Environment Variables will be created for SNS Topic ARNs:

* `[TOPIC_NAME_IN_UPPERCASE_SNAKE_CASE]_SNS_TOPIC_ARN` for the topic ARN

For example, for a topic with the name `userCreated`, the `USER_CREATED_SNS_TOPIC_ARN` env var will be set.

#### SQS Connection

See [SQSHelper](#build-hook) (`sourceSnsTopic` property) to know how to link a topic to an SQS Queue.

#### Quick hook example

```js
const { helper } = require('sls-helper'); // eslint-disable-line
const { SNSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

module.exports = helper({
	hooks: [
		// other hooks

		// must spread it
		...SNSHelper.buildHooks({
			topic: {
				name: 'userCreated'
			}
		})
	]
});
```

## Full example

```js
// serverless.js

'use strict';

const { helper } = require('sls-helper'); // eslint-disable-line

// Only for SQS
const { SQSHelper } = require('sls-helper-plugin-janis');  // eslint-disable-line

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
		}],

		['janis.functionsVpc', {
			vpcId: 'vpc-11111111',
			subnetIds: [
				'subnet-111111111',
				'subnet-222222222'
			]
		}],

		['janis.functionUrl', {
			subdomainName: 'subSubdomain.subdomain',
			acmCertificate: '${param:acmCertificateId}',
			functions: [
				{
					functionName: 'CustomUrlLambda',
					path: '/customUrl/*'
				}
			]
		}],

		...SNSHelper.buildHooks({
			topic: {
				name: 'productUpdated'
			}
		}),

		SQSHelper.sqsPermissions,

		...SQSHelper.buildHooks({
			name: 'ProductToUpdate',
			// Link previously created SNS Topic to the main queue
			sourceSnsTopic: {
				name: 'productUpdated',
				filterPolicy: {
					'platform': ['fullcommerce']
				}
			}
		})
	]
}, {});
```