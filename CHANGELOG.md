# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/), versioning follows [SemVer](https://semver.org/).

## [1.5.0] — 2026-08-27

### Fixed (STAB-1 — validated on real PS3, 2026-08-26)
- **Playback never initialized** (endless loading): `page.type = 'video'` is now re-asserted right before assigning the video source — `setPageHeader`/API calls reset the page type on Movian, and the refactor had dropped the re-assert the legacy plugin did.
- **PS3 stalls on the raw `TranscodingUrl`**: new `sanitizePlaybackUrl()` normalizes the Jellyfin 10.11 `?&` (empty first query param) and mid-query `&&` quirks, and comma-encodes query values (`aac,ac3` → `aac%2Cac3`).
- **No picture/sound on opus/flac files** (`HLS [E] Unsupported estype 0x6`): the device profile now only advertises `aac,ac3,mp3` for HLS, so the server transcodes opus/flac to AAC instead of copying them into the TS (which the PS3 player cannot decode).
- Audio track index 0 now honored (`atrack >= 0`; `-1` stays the default); server-provided `AudioStreamIndex` is removed before appending the user choice (no duplicates).
- Subtitle URLs use `stream.Index` (Jellyfin global stream index) instead of the loop variable.
- `imdbid` videoparam removed (legacy plugin never sent it in practice — typo `Imbd`).
- Audio codec normalization in `isDirectPlaySafe` (`ac-3`/`eac3` → `ac3`).

### Fixed (Jellyfin 10.11.x PlaybackInfo compatibility)
- HTTP 400: removed `VideoRange` `ProfileConditionValue` (deleted in Jellyfin 10.11).
- HTTP 500: removed the `Video` CodecProfile entry (`NullReferenceException` in `StreamBuilder.ApplyTranscodingConditions`); `VideoAudio` kept.

### Changed
- Modernized README and package metadata and repo hygiene (workflows, assets, editorconfig).
- Branch layout: `main` (NEO baseline) + `stability` (core fixes merged back into `main` and upstream).
- Agent-friendly structure: AGENTS.md (YAML frontmatter, external-agent policy), STATE.md, TASKS.md, DECISIONS.md, TESTING.md, CONTRIBUTING.md, SECURITY.md, `agent.md`, `llms.txt`, labels (`agent-ready`, `agent-submission`, ...).
- PS3 test harness `scripts/test-ps3.sh` (+ `jf-sessions.py`): L0 build/lint, L2a FTP deploy + hash, L2b log scan, L2c playback watch (session position + server transcode sensors). Private env in git-ignored `scripts/.ps3-test.env`.
- Update pipeline (STAB-2): built-in upgrader + download URL now point to `FloStyle/m7-jellyfin` releases; `scripts/release.sh` cuts releases (version bump + tag → GitHub Actions builds/publishes `dist/jellyfin.zip`); upgrader stays silent when no release exists.

### Added
- Central HTTP client (`src/http.js`) with `api_key`/token scrubbing from logs and structured errors.
- Playback session reporting (`src/session.js`): Playing / Progress / Stopped.
- Strict PS3 device profile (`src/deviceProfile.js`).
- Playback settings: max streaming bitrate (8/20/40 Mbps), force transcode.
- Bounded cache (300 entries, TTL 5 min).
- i18n strings for errors/settings (en, it).

## [1.1.4] — upstream baseline (LouisMarotta/m7-jellyfin)

Last upstream release this fork is based on. See upstream repository for its history.
