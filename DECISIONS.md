---
name: "Decisions"
type: adr_log
version: "1.0.0"
updated: "2026-08-26"
---

# DECISIONS.md — Architecture Decision Records

> Format: status / context / decision / consequences. Append-only. Agents may add entries only with maintainer approval.

## ADR-0001 — Project suspended (STATE CLEAN)

- **Status**: accepted (2026-08-26)
- **Context**: after the 400/500 fixes, the refactored zip stalls on real PS3 (player refuses the raw `TranscodingUrl`); repeated agent dispatches were consuming time without a validated result.
- **Decision**: freeze code work. Keep the old (working) zip on the PS3. Document everything; dispatch missions only on explicit maintainer request.
- **Consequences**: zero risk of regressions on the deployed plugin; all future work is mission-based and test-gated on real hardware.

## ADR-0002 — Git structure: `main` + `stability` + `feat/*`

- **Status**: accepted (2026-08-26)
- **Context**: two goals (upstream stability PR + personal NEO modernization) needed a non-conflicting layout.
- **Decision**: `main` = NEO baseline (default branch); `stability` = core fixes/perf, merged back into `main` and forwarded upstream via PR; `feat/<name>` = features. `master` renamed/deleted.
- **Consequences**: clean separation of concerns; PRs to upstream are always from `stability`; NEO features never pollute the upstream PR.

## ADR-0003 — Drop-in replacement proven (plugin id `jellyfin`)

- **Status**: accepted (2026-08-26)
- **Context**: replacing the zip on PS3 must not lose settings/data.
- **Decision**: verified `plugin.json` identity (`id: jellyfin`, title, apiversion, file) is identical between old and new builds → zip swap preserves `settings/plugins/jellyfin/`. Update channel = `FloStyle/m7-jellyfin` releases (upgrader + GitHub Actions).
- **Consequences**: no reconfiguration on updates; first NEO release (`v1.2.0`) only after PS3 validation.

## ADR-0004 — Agent-friendly public structure

- **Status**: accepted (2026-08-26)
- **Context**: external AI agents should be able to read/audit/contribute safely.
- **Decision**: `AGENTS.md` with YAML frontmatter + explicit external-agent policy (`mission_only` code, human review, no auto-merge); `agent.md`, `llms.txt`, `CONTRIBUTING.md`, `SECURITY.md`, dedicated labels (`agent-ready`, `agent-submission`, `agent-review-required`, `needs-human-review`).
- **Consequences**: bots can discover and contribute safely; code stays mission-gated; repo stays clean of private data.

## ADR-0005 — "Agent OS" guide: adapted, not adopted wholesale

- **Status**: accepted (2026-08-26)
- **Context**: external advice (Qwen) proposed a full multi-agent OS (ORCHESTRATOR/PROTOCOL/SESSIONS/MEMORY/KNOWLEDGE/.agents/*).
- **Decision**: adopt `STATE.md`, `TASKS.md`, `DECISIONS.md` only. Reject the rest: our model is sequential missions (1 agent = 1 branch), memory stays local/private (`docs/`, vault), no parallel orchestration needed.
- **Consequences**: low ceremony, truthful repo (phase: suspended), no dead state files.
