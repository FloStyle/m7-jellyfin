<p align="center">
  <img src="assets/logo.png" alt="logo" title="Jellyfin" height="45px" width="45px" />
</p>

# Movian Jellyfin (NEO)

A modern, hardened **Jellyfin client for Movian** — built for **PlayStation 3**, tested against **Jellyfin 10.11+**.

Fork of [LouisMarotta/m7-jellyfin](https://github.com/LouisMarotta/m7-jellyfin) with a reworked playback pipeline, a strict PS3 device profile, and a hardened HTTP/session layer.

[![GitHub Release](https://img.shields.io/github/v/release/FloStyle/m7-jellyfin?display_name=tag&sort=semver)](https://github.com/FloStyle/m7-jellyfin/releases)
[![GitHub Downloads](https://img.shields.io/github/downloads/FloStyle/m7-jellyfin/total)](https://github.com/FloStyle/m7-jellyfin/releases)
[![CI Status](https://img.shields.io/github/actions/workflow/status/FloStyle/m7-jellyfin/release.yml?branch=main)](https://github.com/FloStyle/m7-jellyfin/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](./LICENSE.md)
[![Jellyfin](https://img.shields.io/badge/Jellyfin-10.9--10.11-blue)](https://jellyfin.org)
[![Platform](https://img.shields.io/badge/Platform-PS3%20%2F%20Movian-green)](https://movian.tv)

## 📦 Install (PlayStation 3)

1. Download the latest `jellyfin.zip` from [Releases](https://github.com/FloStyle/m7-jellyfin/releases) <!-- RENAME-TRACKER: Update to m7-jellyfin-neo -->
2. Copy to `/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/` (FTP or USB)
3. Restart Movian, then enter your Jellyfin server address + credentials in the plugin settings

> **Drop-in safe:** The plugin ID is unchanged (`jellyfin`). Your settings survive updates.

## 🔧 Build

```bash
pnpm i
pnpm run build   # → dist/jellyfin.zip
```

Dev: `pnpm lint` (zero errors), `pnpm format`, `libs/` = Movian type definitions for IDE.

## 🌿 Branches

| Branch | Purpose |
|---|---|
| `main` | NEO baseline (default) — modern features |
| `stability` | Core fixes & performance → merged into `main` + upstream PR |

## 🤝 Contributing

- Humans: see [CONTRIBUTING.md](CONTRIBUTING.md)
- Security issues: see [SECURITY.md](SECURITY.md)

## 🤖 AI Agent Integration

This repository is designed for both human and AI agent collaboration. The following resources are available:

| Resource | Description |
|---|---|
| [llms.txt](llms.txt) | LLM Context Index — quick links to all documentation |
| [AGENTS.md](.github/agent-workspace/AGENTS.md) | Agent Permissions & Missions — scope, policies, workflow |
| [DECISIONS.md](docs/adr/DECISIONS.md) | Architecture Decision Records — rationale for key choices |
| [TESTING.md](.github/agent-workspace/TESTING.md) | L0-L3 Hardware Testing Protocol — on-device validation |

External AI agents should read [AGENTS.md](.github/agent-workspace/AGENTS.md) before proposing any code changes.

## 🔌 Compatibility

H.264 ≤ 1080p (level 4.1, 8-bit SDR) direct play; AAC/AC3/MP3 ≤ 5.1. HEVC/AV1/VP9/4K/HDR/10-bit → server HLS transcode. See [AGENTS.md](.github/agent-workspace/AGENTS.md) §4 for the full constraint list.

## 📄 License

[GNU General Public License v3.0 ©](./LICENSE.md)
