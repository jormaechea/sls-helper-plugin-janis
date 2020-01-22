# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
