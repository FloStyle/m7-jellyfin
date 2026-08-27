---
name: "Movian Jellyfin (NEO) — Global State"
type: state
version: "1.1.0"
updated: "2026-08-26"
phase: "active"
coordinator: "maintainer (human)"
---

# STATE.md — Global State

> Read this first. Every agent must check this file before starting any work.

## Current status

- **Phase: ACTIVE (stability track).** STAB-1 and STAB-2 are DONE and validated on real PS3 (2026-08-26). See `TASKS.md` for the index, `DECISIONS.md` for rationale.
- **PS3 deployment**: the **new (fixed) zip** is deployed and working — playback validated (DirectPlay and HLS transcode, incl. opus-audio titles). The legacy zip is kept in `backup/` for rollback.
- **Server note**: Jellyfin transcoding requires free GPU VRAM; a heavy GPU service on the server causes ffmpeg OOM (exit 218, segment 500) — not a plugin bug.

## Active sessions

None (suspended) — missions are dispatched one at a time by the maintainer.

## Branches

| Branch | Purpose | Status |
|---|---|---|
| `main` | NEO baseline (default) | current |
| `stability` | Core fixes/perf → merge into `main` + upstream PR | current |

## Priorities

1. **STAB-3** — session reporting: `POST /Sessions/Playing/Progress` shows `invalid_json` on 204 responses (cosmetic) and the reported position stays frozen (player position not wired to the plugin) — dashboard accuracy only, does not block playback
2. **First release `v1.2.0`** — cut via `scripts/release.sh` once the maintainer validates L3 (real-world usage: 5.1 audio, subtitles, resume, episode chaining, update flow)
3. **Upstream PR** — prepare the PR to `LouisMarotta/m7-jellyfin` from `stability` (full validated diff: 400/500 fixes + STAB-1 + STAB-2)
4. **NEO roadmap** — language prefs, Ethernet/Wi-Fi mode, dynamic home, rich details, QuickConnect/QR, multi-user

## Blockers

- None critical. Playback works on real PS3.
- L3 validation (user acceptance) pending before the first release.
- GPU VRAM contention on the server during Jellyfin tests (free VRAM first).
