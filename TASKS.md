---
name: "Tasks"
type: task_index
version: "1.0.0"
updated: "2026-08-26"
---

# TASKS.md — Task Index

> Statuses: `todo` → `assigned` → `in_progress` → `review` → `done` (or `blocked` / `cancelled`).
> One mission = one agent = one branch. Mission specs live in `docs/missions/` (versioned).

## Active tasks

| id | title | status | priority | branch | spec |
|---|---|---|---|---|---|
| STAB-1 | Sanitize `TranscodingUrl` before player + trivial playback bugs (`atrack >= 0`, subtitle `stream.Index`, codec normalization) | todo | critical | `stability` | `docs/missions/stability-1-transcoding-url.md` |
| STAB-2 | Upgrader → `FloStyle/m7-jellyfin` releases (drop-in updates) | todo | high | `stability` | `docs/missions/stability-2-updater.md` + `docs/plans/plan-drop-in-updates.md` |
| STAB-3 | Session reporting auth: `POST /Sessions/Playing/Progress` fails with « Authentication without realm » (401 no WWW-Authenticate) — observed in PS3 logs | todo | normal | `stability` | local test logs |
| NEO-A1 | Audio/subtitle language preferences (`/Users/{id}`) | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-A2 | Ethernet/Wi-Fi connection mode (40/15 Mbps) | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-A3 | Session/multi-user handling (401 → login, switch user) | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-A4 | Cache improvements (TTLs, bounded) | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-B1 | Dynamic home screen (Resume/NextUp/Recent) | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-B2 | Rich detail pages (backdrop, cast, chapters) | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-B3 | Series navigation improvements | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-B4 | Modernized look | todo | low | `main` | `docs/missions/neo-roadmap.md` |
| NEO-C1 | QuickConnect / QR identification | todo | normal | `main` | `docs/missions/neo-roadmap.md` |
| NEO-C2 | Structural refactor (`src/core|api|ui`) — incremental | todo | low | `main` | `docs/missions/neo-roadmap.md` |
| NEO-C3 | Tech-debt cleanup | todo | low | `main` | `docs/missions/neo-roadmap.md` |

## Completed

| id | title | completed_at | result |
|---|---|---|---|
| — | Jellyfin 10.11 compatibility (PlaybackInfo 400/500) | 2026-08-26 | 200 stable, in `main` |
| — | Repo hygiene + agent-friendly structure (AGENTS/README/CONTRIBUTING/SECURITY/llms/labels) | 2026-08-26 | pushed to `main` |

## Rules

- Every task has a unique id and lives in `docs/missions/` with a full spec.
- A task is assigned to exactly one agent.
- A blocked task must state its reason.
- Update this file + `STATE.md` when a task changes status.
