# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [10.4.0] - 2025-08-18
### Added
- Support for FIFO SNS Topics and subscriptions to FIFO SQS Queues

## [10.3.2] - 2025-08-06
### Fixed
- Fixed DLQ queue consumer dependency on archive DLQ

## [10.3.1] - 2025-06-24
### Fixed
- Fixed DLQ setup to avoid setting `RedrivePolicy` when there is no consumer (and no Archive DLQ)

## [10.3.0] - 2025-06-23
### Added
- Support for SQS Archive DLQ

## [10.2.0] - 2025-04-29
### Added
- New custom managed policy `JanisBasePolicy{Env}` as base service config (#69)

### Fixed
- Avoid cross-account SNS subscriptions in local environment (#67)

## [10.1.0] - 2024-11-15
### Added
- Suppor for `custom.localAccountsIdsByService` property to fetch SSM Parameter from the same AWS account

## [10.0.0] - 2024-11-08
### Added
- Support for SNS to SQS cross-account subscription
- Support for multiple SNS Topics as SQS Sources

### Changed
- Peer Dependency `sls-helper@1.15` is now required **BREAKING CHANGE**

## [9.9.0] - 2024-11-08
### Added
- New default IAM Policy to grant access to SSM Parameter Store

## [9.8.1] - 2024-10-21
### Changed
- Cost allocation tags changed to make them simpler: `SQSConstruct` changed to `ResourceSet`; `IsDLQ` and `IsDelayed` unified into `SQSType: Main | Delay | DLQ`
- Added `HasConsumer` tag to queues to improve monitoring of DLQs

## [9.8.0] - 2024-10-18
### Added
- Opt-in to completely disable SQS env vars. The `getEnvVar` method is available to get the key-value env var for main queues
- SNS Topic creation support
- SNS to SQS subscription support

### Changed
- Delayed Queues and DLQs do not set env vars by default any more. To keep them available, you must set the `generateEnvVars` property on each queue configuration (#64)

## [9.7.0] - 2024-08-15
### Added
- Support for Delay Queues in SQS Helepr (#63)

## [9.6.0] - 2024-07-31
### Added
- Support for FIFO Queues in SQS Helper (#62)

## [9.5.6] - 2024-07-24
### Changed
- APIs and Event Listeners with the `skipTraceLayer` property do not set the `JANIS_TRACE_EXTENSION_ENABLED` env var any more (#61)

## [9.5.5] - 2024-06-19
### Changed
- Changed log retention from 14 days to 60 days

## [9.5.4] - 2024-06-11
### Changed
- Improved package default exclude list

## [9.5.3] - 2024-03-08
### Changed
- Simplified and added CORS to more Gateway Responses using `DEFAULT_4XX` and `DEFAULT_5XX`

### Fixed
- API Gateway request template does not fail when receiving single quotes in qs parameters, headers, etc

## [9.5.2] - 2024-03-07
### Fixed
- `State Machine` now supports task with `Parameters.Input` such as Step Functions Execution Trigger

## [9.5.1] - 2024-03-04
### Fixed
- `State Machine` now supports task with `Parameters.Target.Input` such as EventBridge Scheduler

## [9.5.0] - 2024-02-16
### Added
- `SQS` DLQs now have a `IsDLQ` tag

## [9.4.0] - 2024-02-07
### Added
- `State Machine` can now create a Log Group automatically when `loggingConfig` is set
- `Tags` were added to Cloudformation Stacks, their resources and to deployment artifacts

### Changed
- `Authorizers` are now marked as external so they don't generate a permission resource
- Deployment is now direct instead of via Cloudformation Change Sets

## [9.3.0] - 2024-01-24
### Added
- `State Machine` now sets execution State to tasks by default. This allows to check whether a task is executed as a retry or not.
- `State Machine` now supports Express Workflows, Logging configuration and Raw properties.

## [9.2.2] - 2023-09-27
### Fixed
- `NoClientAuthorizer` and `AdminNoClientAuthorizer` don't require the janis-client header any more

## [9.2.1] - 2023-09-27
### Fixed
- Rollback `kebabCase` implementation to avoid breaking services with alphanumeric names

## [9.2.0] - 2023-08-05
### Added
- `SQS Helper` queues now have tags to filter costs and metrics
- `SQS Helper` now supports partial batch item failure report

### Changed
- `SQS Helper` default settings are now more optimized

## [9.1.0] - 2023-08-04
### Added
- `SQS Helper` added to easily implement Queues and DLQs

## [9.0.0] - 2023-07-24
### Changed
- Now authorizers `UserAuthorizer`, `DevUserAuthorizer`, `ImportExportAuthorizer`, `AdminNoClientAuthorizer` and `NoClientAuthorizer` require `janis-client` header **BREAKING CHANGE**
- Now authorizers `ServiceNoClientAuthorizer`, `AdminNoClientAuthorizer` and `NoClientAuthorizer` use their own functions **BREAKING CHANGE**
- Now authorizer `ImportExportAuthorizer` requires `janis-service` header **BREAKING CHANGE**

### Removed
- Unused authorizers `LoggedAuthorizer`, `ApiKeyAuthorizer`, `ImportAuthorizer` and `ExportAuthorizer` **BREAKING CHANGE**

## [8.2.0] - 2023-07-24
### Added
- `api`, `apiList`, `apiGet`, `apiPost` and `apiPut` helpers now support `layers` and `addLayers` to manage function-level lambda layers
- `eventListener` helper now support `layers`, `addLayers` and `skipTraceLayer` to manage function-level lambda layers

## [8.1.0] - 2023-07-13
### Added
- `functionUrl` hook to enable Lambda URLs with Cloudfront Distributions (https://janiscommerce.atlassian.net/browse/JC-268)
- `eventListener` hook now accepts `functionRawProps` to customize the lambda function

## [8.0.0] - 2023-06-15
### Added
- Automatic VPC Config for all functions of the service when `LAMBDA_SECURITY_GROUP_ID` and `LAMBDA_SUBNET_IDS` env vars are set

### Changed
- Now the `accountId` for hook `authorizers` is read from env var `AUTHORIZER_ACCOUNT_ID`

## [7.3.0] - 2023-06-15
### Added
- Added `x-janis-totals` and `x-janis-only-totals` to default CORS configuration

## [7.2.1] - 2023-05-29
### Fixed
- Added `@babel/runtime` to default package includes to avoid breaking services that use `date-fns`

## [7.2.0] - 2023-05-10
### Added
- Support for `default` or any other custom stage in stage parameters

## [7.1.3] - 2023-05-04
### Fixed
- Fixed function VPC Security Group config

## [7.1.2] - 2023-05-04
### Fixed
- Now `functionsVpc` hook allows to pass null or undefined params

## [7.1.1] - 2023-05-04
### Fixed
- Adapted `functionsVpc` hook to be able to enable or disable by stage

## [7.1.0] - 2023-05-04
### Added
- New hook `functionsVpc` to attach a service to a VPC

### Fixed
- Lambda `AWSLambdaVPCAccessExecutionRole` Role is attached even if a VPC is not set at the provider level

## [7.0.3] - 2023-04-21
### Changed
- Changed aws-sdk package for @aws-sdk packages to default exclude to reduce bundle size (it is already installed in lambda)

## [7.0.2] - 2023-04-21
### Fixed
- Rollbacked `provider.iam.role` to `provider.role` because it wasn't compatible with core `iamStatement` hook

## [7.0.1] - 2023-04-21
### Fixed
- Default axios exclude fixed for axios@1

### Changed
- Moved `provider.role` to `provider.iam.role` to be ready for next sls major release

## [7.0.0] - 2023-04-21
### Added
- Support for [Serverless parameters](https://www.serverless.com/framework/docs/guides/parameters) for each environment.

### Changed
- Migration to `serverless@3`. You should probably upgrade every plugin you are using. **BREAKING CHANGE**
- Rolled back to `serverless-plugin-split-stacks` plugin instead of `@janiscommerce/serverless-plugin-split-stacks` **BREAKING CHANGE**

### Deprecated
- Serverless `${self:custom.janisDomains}` and `${self:custom.humanReadableStage}` variables deprecated in favor of `${param:janisDomain}` and `${param:humanReadableStage}`. Custom props will be removed in a future major version.

### Removed
- 'janis.base` does not accept `apiSecrets` any more. AWS Secrets manager must be used instead. **BREAKING CHANGE**

## [6.0.0] - 2023-03-09
### Changed
- Set default runtime to node 18 **BREAKING CHANGE**
- Changed `serverless-plugin-split-stacks` plugin to `@janiscommerce/serverless-plugin-split-stacks` **BREAKING CHANGE**

## [5.13.4] - 2023-03-09
### Fixed
- Removed ajv from default excludes and added some mongo and aws sdk dependencies

## [5.13.3] - 2023-01-09
### Fixed
- Now `Parameters` are not set in steps that follow a `Parallel` step to avoid setting a property on an array

## [5.13.2] - 2023-01-04
### Fixed
- Fixed state machine parameter setup for Tasks that trigger a new State machine

## [5.13.1] - 2023-01-02
### Fixed
- Fixed mapping of Map states with different iterator properties

## [5.13.0] - 2022-12-26
### Added
- Step function hook now sets Task `Parameters` to include `session`, `body` and `stepFunction` data, so Lambdas con detect if they are being run inside a step function

## [5.12.0] - 2022-12-21
### Added
- Access logs now contain API Gateway and integration errors

## [5.11.0] - 2022-12-06
### Added
- API Gateway response compression enabled starting at 1KB response size

## [5.10.0] - 2022-11-23
### Added
- APIs hooks can received `functionName` to use as function name

### Changed
- Standard for API CRUD function names

## [5.9.0] - 2022-11-16
### Added
- Added support for the `skipTraceLayer` in APIs and set it as default in read APIs
- Docs for Trace Lambda Layer

### Fixed
- Dependencies updated to fix vulnerabilities

## [5.8.0] - 2022-11-10
### Added
- Support for Trace Layer with env vars

## [5.7.2] - 2022-09-19
### Fixed
- Fixed offline response CORS expose headers

## [5.7.1] - 2022-09-16
### Fixed
- Fixed offline response CORS expose headers

## [5.7.0] - 2022-09-16
### Added
- CORS config to allow exposing fixed filters header

## [5.6.0] - 2022-09-05
### Added
- Api Gateway access logs configuration

### Changed
- Disabled API Gateway default endpoint by default

## [5.5.1] - 2022-01-28
### Added
- Added more default includes to reduce bundle size

## [5.5.0] - 2022-01-19
### Added
- Added `janis-entity-id` to default CORS allowed headers

## [5.4.6] - 2021-12-28
### Fixed
- New default includes are now properly configured

## [5.4.5] - 2021-12-28
### Changed
- Added more default includes to reduce bundle size

## [5.4.4] - 2021-12-07
### Fixed
- Fixed `rawBody` line break escaping

## [5.4.3] - 2021-12-07
### Changed
- Added `/view-schemas-built-local` to function default excludes

### Fixed
- Fixed `rawBody` single quote escaping

## [5.4.2] - 2021-11-11
### Fixed
- Fixed `rawBody` property generation in local envs

## [5.4.1] - 2021-11-11
### Fixed
- Fixed `rawBody` property generation in request template

## [5.4.0] - 2021-11-11
### Added
- Added `rawBody` property to request template
- Dropped support for node 10.x

## [5.3.2] - 2021-11-08
### Changed
- Added more paths to default excludes in order to reduce function bundle sizes

## [5.3.1] - 2021-08-07
### Fixed
- `x-janis-authorizer-error-type` header for GatewayResponses moved to `authorizerErrorType` response body property

## [5.3.0] - 2021-08-06
### Added
- `x-janis-authorizer-error-type` header for GatewayResponses
- `AUTHORIZER_FAILURE` error type handling
- `detail` property to show the custom `errorMessage` from the authorizer context

## [5.2.1] - 2021-06-28
### Changed
- `AdminNoClientAuthorizer` now uses `AdminAuthorizer` lambda function
- `NoClientAuthorizer` now uses `FullAuthorizer` lambda function

## [5.2.0] - 2021-06-18
### Added
- New authorizers `AdminAuthorizer` and `AdminNoClientAuthorizer`

## [5.1.0] - 2021-05-29
### Added
- Authorizers validation to prevent an invalid authorizer

## [5.0.1] - 2021-03-05
### Fixed
- Stage an region are now properly set in provider object

## [5.0.0] - 2021-02-05
### Changed
- Default runtime is now nodejs 14
- Default memory size is now 1GB

## [4.3.1] - 2021-01-27
### Fixed
- State functions naming
- State functions documentation

## [4.3.0] - 2021-01-26
### Added
- Added `stateMachine` hook

## [4.2.1] - 2021-01-11
### Fixed
- Fixed response template to include custom errors properly

## [4.2.0] - 2020-12-10
### Added
- Authorizers `ImportAuthorizer` and `ExportAuthorizer`
- Header `janis-service` is now allowed in CORS configuration

### Deprecated
- Authorizer `ImportExportAuthorizer` replaced with `ImportAuthorizer` or `ExportAuthorizer`

## [4.1.0] - 2020-12-09
### Changed
- API Gateway custom domain configured to use TLS 1.2

## [4.0.0] - 2020-10-27
### Changed
- CORS default config now supports any origin **BREAKING CHANGE**

## [3.4.2] - 2020-10-22
### Fixed
- Fixed kebabcase for base, api and event-listener hooks

## [3.4.1] - 2020-10-21
### Fixed
- CORS APP wildcard for local env

## [3.4.0] - 2020-09-29
### Added
- CORS default config now supports APP wildcard

## [3.3.1] - 2020-09-08
### Fixed
- Typo in service base default excludes
- Missing property for local envs is now validated

## [3.3.0] - 2020-09-07
### Added
- Now API hooks can configure their request mapping templates with `requestTemplates` property

### Fixed
- CORS documentation fix

## [3.2.4] - 2020-09-04
### Fixed
- Restored some useful request template properties

## [3.2.3] - 2020-09-04
### Fixed
- Added Authorization header to CORS allowed headers

## [3.2.2] - 2020-09-04
### Fixed
- Request template ignore other authorizer props to prevent breaking due to JWT claims

## [3.2.1] - 2020-09-03
### Changed
- Improved request template to be smaller (removed unused props)
- Improved response templates to be fewer. Now status code is being overridden with a single template. 500 and 504 templates remain separated due to lambda errors handling

## [3.2.0] - 2020-09-02
### Added
- Gateway response configuration for integration timeout.
- Request template for `application/x-www-form-urlencoded` removed (needs serverless@1.81.0 or greater)

## [3.1.0] - 2020-08-21
### Added
- Added `dbConfig` hook to implement AWS Secrets

## [3.0.0] - 2020-07-27
### Added
- Added `include` and `includeOnly` properties to base helper to customize packaging
- Added `excludeOnly` properties to base helper to customize packaging
- Added `plugins` and `pluginsOnly` properties to base helper to customize plugins

### Changed
- Now functions are not packaged individually any more. **BREAKING CHANGE**

### Removed
- Unused default plugins `serverless-reqvalidator-plugin` and `serverless-plugin-reducer`

## [2.13.3] - 2020-07-15
### Fixed
- Response template fix for error messages with single quotes

## [2.13.2] - 2020-06-26
### Fixed
- Response template fix for local environment

## [2.13.1] - 2020-06-23
### Fixed
- Response template fix

## [2.13.0] - 2020-06-23
### Added
- Response template now handles `messageVariables` in response body

## [2.12.0] - 2020-04-24
### Added
- APIs now can configure custom CORS properties

### Changed
- Functions are no longer versioned not pruned by default

## [2.11.0] - 2020-04-21
### Added
- `timeout` support for Event Listeners hooks

## [2.10.1] - 2020-04-06
### Fixed
- Custom IAM Role name now includes the stage to avoid collision between environments

## [2.10.0] - 2020-04-06
### Added
- Custom IAM Role added to avoid hitting IAM Policy size limit

### Changed
- Sls helper peer dependency changed to 1.9.0 or higher

## [2.9.2] - 2020-03-26
### Fixed
- Escaped error response message to avoid breaking JSON structure

## [2.9.1] - 2020-03-26
### Fixed
- Response template now cleans up superstruct errors

## [2.9.0] - 2020-03-18
### Changed
- NAMING: Lambda functions naming changed to prevent function names to be too long

## [2.8.0] - 2020-03-18
### Added
- Header `janis-entity` is now allowed in CORS configuration

## [2.7.0] - 2020-03-04
### Added
- Support for `ImportExportAuthorizer`

## [2.6.0] - 2020-02-26
### Added
- `package.include` support for event listeners
- Lambda log groups now have a default retention of 14 days

## [2.5.0] - 2020-02-21
### Added
- API Gateway response `AUTHORIZER_CONFIGURATION_ERROR`

### Fixed
- API Gateway responses are not overridden any more

## [2.4.1] - 2020-02-20
### Fixed
- API hook now normalizes the path to avoid bad function naming

## [2.4.0] - 2020-02-19
### Added
- `package.include` support for all API hooks

## [2.3.0] - 2020-02-19
### Added
- `timeout` support for all API hooks
- `functionRawProps` support for all API hooks
- `eventRawProps` support for all API hooks

## [2.2.0] - 2020-02-18
### Added
- Custom authorizer support added in event listeners
- Custom authorizers can now be defined in `custom.authorizers` object in initial config and they will be remain untouched

### Fixed
- Authorizers now use the correct ARN

## [2.1.0] - 2020-02-14
### Added
- Access denied API Gateway response resource added with CORS headers

## [2.0.0] - 2020-02-10
### Added
- `authorizers` now have require the Account ID as a configuration option
- Added the `@janiscommerce/serverless-plugin-remove-authorizer-permissions` serverless plugin to allow cross-account deployments

## [1.3.4] - 2020-02-05
### Fixed
- `authorizers` now have the name property to avoid collisions

## [1.3.3] - 2020-01-22
### Fixed
- `eventListener` hook function name now includes the service name

## [1.3.2] - 2020-01-22
### Fixed
- `base` hook prune plugin typo fix

## [1.3.1] - 2020-01-21
### Fixed
- `eventListener` documentation fixed

## [1.3.0] - 2020-01-16
### Added
- `janis.api` hook added to implement custom APIs

### Changed
- Option `serviceName` changed to `serviceCode` in `janis.base` hook **BREAKING CHANGE**
- Added service name to naming, file path and API path in `janis.eventListener` hook

## [1.2.4] - 2019-12-27
### Fixed
- Authorizers in event listeners are now correctly configured

## [1.2.3] - 2019-12-27
### Fixed
- Authorizers fixed to match the correct function name

## [1.2.2] - 2019-12-26
### Fixed
- Serverless offline cache invalidation regex fixed

## [1.2.1] - 2019-12-26
### Fixed
- Service name in lower case is now in *kebab-case*

## [1.2.0] - 2019-12-26
### Added
- `apiSecrets` configuration in base hook
- Sample service example in README

### Fixed
- `base` documentation updated with required fields

## [1.1.0] - 2019-12-25
### Changed
- Runtime upgraded to nodejs.12x
- Base hook updated to the last configurations
- New authorizers added
- Event listener hook added
