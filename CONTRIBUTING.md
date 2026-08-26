# Contributing

Thanks for considering a contribution to **m7-jellyfin (NEO)** — a Jellyfin client for Movian on PlayStation 3.

## Before you start

- Read [`AGENTS.md`](AGENTS.md) — it defines the project rules (PS3 constraints, security, coding conventions) and the mission-based workflow.
- **Project status**: SUSPENDED between missions. Code work happens only on maintainer-dispatched missions or explicit invitation. Documentation improvements are always welcome.

## Ways to contribute

| Type | How |
|---|---|
| Bug report | Open an issue with: plugin version, Jellyfin version, device, what happened, logs (tokens scrubbed!) |
| Feature suggestion | Open an issue labelled `feature` / discuss in issues |
| Documentation | PR on `main` — always welcome |
| Code (mission) | Follow the mission spec; branch `feat/<name>` or `stability` |
| Code (external agent) | Branch `agent/<name>`, PR labelled `agent-submission`, human review required |

## Development workflow

1. `pnpm install`
2. `pnpm run build` → `dist/jellyfin.zip`
3. `pnpm lint` — must pass with **zero errors** (ESLint)
4. `pnpm format` — Prettier (optional but recommended)
5. `libs/` contains Movian type definitions for IDE support

## Branching

- `main` — NEO baseline, default branch
- `stability` — core bugfixes/perf, merged back into `main` and forwarded upstream
- `feat/<name>` — features
- `agent/<name>` — external agent contributions

Never commit directly to `main`. Never force-push shared branches.

## Pull request checklist

- [ ] Branch from the right base (`main` for features/docs, `stability` for fixes)
- [ ] Clear PR title: `feat(scope): ...` / `fix(scope): ...` / `docs(scope): ...` — or `agent: ...` for bot submissions
- [ ] Description: what/why/how
- [ ] `pnpm lint` zero errors
- [ ] No secrets, no private IPs/paths, no token in logs
- [ ] Playback/device-profile/HTTP changes are tested on real PS3 before merge (the maintainer or the assistant deploys)

## License

By contributing, you agree your contributions are licensed under [GPL-3.0-only](LICENSE.md).
