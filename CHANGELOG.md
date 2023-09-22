# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.14.1] - 2023-09-22
### Added
- New headers `x-janis-totals` and `x-janis-only-totals` allowed in default CORS config

## [5.14.0] - 2023-07-05
### Added
- `eventListener` hook now accepts `functionRawProps` to customize the lambda function

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
- Fixed mapping of Map states with differente iterator properties

## [5.13.0] - 2022-12-26
### Added
- Step function hook now sets Task `Parameters` to include `session`, `body` and `stepFunction` data, so Lmabdas con detect if they are being run inside a step function

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
