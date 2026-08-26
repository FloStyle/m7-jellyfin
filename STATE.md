---
name: "Movian Jellyfin (NEO) — Global State"
type: state
version: "1.0.0"
updated: "2026-08-26"
phase: "suspended"
coordinator: "maintainer (human)"
---

# STATE.md — Global State

> Read this first. Every agent must check this file before starting any work.

## Current status

- **Phase: SUSPENDED** — no active mission. Code work happens only when the maintainer dispatches a mission (see `TASKS.md`).
- **PS3 deployment**: the **old (working) zip** is deployed. The refactored code in this repo is **NOT deployable as-is** (playback stalls on the raw `TranscodingUrl` — see AGENTS.md §8).
- **Server note**: Jellyfin transcoding requires free GPU VRAM; a heavy GPU service on the server causes ffmpeg OOM (exit 218, segment 500) — not a plugin bug.

## Active sessions

None (suspended).

## Branches

| Branch | Purpose | Status |
|---|---|---|
| `main` | NEO baseline (default) | current |
| `stability` | Core fixes/perf → merge into `main` + upstream PR | current |

## Priorities

1. **stability-1** — fix the PS3 playback stall (blocking: the fork is undeployable until done)
2. **stability-2** — upgrader → `FloStyle/m7-jellyfin` releases (drop-in updates)
3. NEO roadmap (language prefs, Ethernet/Wi-Fi, dynamic home, rich details, QuickConnect/QR, multi-user)

See `TASKS.md` for the full index, `DECISIONS.md` for the rationale behind these priorities.

## Blockers

- `stability-1` not started (no mission dispatched yet — maintainer decision)
- No release (`v1.2.0`) until the fixed zip is validated on real PS3
- GPU VRAM contention on the server during Jellyfin tests
