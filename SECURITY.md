# Security Policy

## Reporting a vulnerability

If you find a security issue in this plugin (token leakage, credential exposure, unsafe URL handling, ...):

1. **Open an issue** at https://github.com/FloStyle/m7-jellyfin/issues — mark it private/security if possible. <!-- RENAME-TRACKER: Update to m7-jellyfin-neo -->
2. Describe the issue and the affected version — **do not post tokens, passwords, or full playback URLs** in the report.
3. If you must share sensitive details, use a maintainer contact through the issue.

## What we take seriously

- `api_key` / token leakage into logs (the code uses `HttpClient.safeLogPath()` — see AGENTS.md §5)
- Credentials sent in URL parameters
- Unsafe playback URL handling (the plugin runs on PS3/Movian — no HTTPS certificate validation options beyond the plugin setting)
- Secrets or private data committed to the repository

## Scope

This policy covers the plugin code in this repository. The Jellyfin server, the Movian platform, and upstream `LouisMarotta/m7-jellyfin` are out of scope.
