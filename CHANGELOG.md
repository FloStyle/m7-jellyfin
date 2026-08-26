# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Changed
- Modernized README, package metadata and repo hygiene (workflows, assets, editorconfig).
- Branch layout: `main` (NEO baseline) + `stability` (core fixes merged back into `main` and upstream).

### Fixed
- Jellyfin 10.11.x PlaybackInfo compatibility:
  - HTTP 400: removed `VideoRange` `ProfileConditionValue` (deleted in Jellyfin 10.11).
  - HTTP 500: removed the `Video` CodecProfile entry (`NullReferenceException` in `StreamBuilder.ApplyTranscodingConditions`); `VideoAudio` kept.

### Added
- Central HTTP client (`src/http.js`) with `api_key`/token scrubbing from logs and structured errors.
- Playback session reporting (`src/session.js`): Playing / Progress / Stopped.
- Strict PS3 device profile (`src/deviceProfile.js`).
- Playback settings: max streaming bitrate (8/20/40 Mbps), force transcode.
- Bounded cache (300 entries, TTL 5 min).
- i18n strings for errors/settings (en, it).

## [1.1.4] — upstream baseline (LouisMarotta/m7-jellyfin)

Last upstream release this fork is based on. See upstream repository for its history.
