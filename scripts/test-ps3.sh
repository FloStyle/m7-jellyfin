#!/usr/bin/env bash
# test-ps3.sh — Automated PS3/Movian validation harness (local tool, NOT pushed)
#
# Levels covered:
#   L0  build + lint
#   L1  Jellyfin API reachable, sessions visible
#   L2  deploy zip -> restart Movian -> logs clean -> playback detected via Jellyfin API
#
# Usage:
#   ./scripts/test-ps3.sh build          # L0: lint + build zip
#   ./scripts/test-ps3.sh deploy         # L2a: FTP upload + hash verify (PS3 must be on)
#   ./scripts/test-ps3.sh logs           # L2b: pull Movian logs, scan for errors
#   ./scripts/test-ps3.sh watch [SECS]   # L2c: watch Jellyfin sessions for active playback
#   ./scripts/test-ps3.sh all [SECS]     # full pipeline: build -> deploy -> logs -> watch
#   ./scripts/test-ps3.sh status         # PS3 reachability + Jellyfin health
#
# Exit codes: 0 = GO, 1 = NO-GO, 2 = environment not ready (PS3 off, etc.)

set -u

# ── Config ───────────────────────────────────────────────────────────────────
# Private values (hosts, ports) live in scripts/.ps3-test.env — local only, git-ignored.
# Public defaults below are placeholders; override via env or the .env file.
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_DIR/scripts/.ps3-test.env"
[ -f "$ENV_FILE" ] && . "$ENV_FILE"

PS3_HOST="${PS3_HOST:-192.168.PS3.IP}"
PS3_ZIP_PATH="${PS3_ZIP_PATH:-/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/jellyfin.zip}"
JF_HOST="${JF_HOST:-http://192.168.JF.IP:8096}"
JF_API_KEY="${JF_API_KEY:-}"
ZIP="$REPO_DIR/dist/jellyfin.zip"
BACKUP_ZIP="$REPO_DIR/backup/backup-jellyfin-ps3-ANCIEN.zip"
LOG_DIR="/tmp/movian-test-logs"
VERBOSE=0

log()  { echo -e "\033[1;36m[test-ps3]\033[0m $*"; }
ok()   { echo -e "\033[1;32m  ✓\033[0m $*"; }
fail() { echo -e "\033[1;31m  ✗\033[0m $*"; }
warn() { echo -e "\033[1;33m  ⚠\033[0m $*"; }

ps3_ftp_up() {
  curl -s -m 5 -o /dev/null "ftp://$PS3_HOST/" -u anonymous: 2>/dev/null
  [ $? -eq 0 ]
}

jf_up() {
  [ -n "$JF_API_KEY" ] && curl -s -m 5 -o /dev/null -w "%{http_code}" "$JF_HOST/System/Info?api_key=$JF_API_KEY" 2>/dev/null | grep -q 200
}

# ── L0: build + lint ─────────────────────────────────────────────────────────
cmd_build() {
  log "L0 — lint + build"
  ( cd "$REPO_DIR" && pnpm lint ) >/dev/null 2>&1 && ok "ESLint zero errors" || { fail "ESLint errors"; return 1; }
  ( cd "$REPO_DIR" && pnpm run build ) >/dev/null 2>&1 && ok "zip built: $(du -h "$ZIP" | cut -f1)" || { fail "build failed"; return 1; }
  return 0
}

# ── L2a: deploy zip via FTP ──────────────────────────────────────────────────
cmd_deploy() {
  log "L2a — deploy zip to PS3"
  local src="${DEPLOY_ZIP:-$ZIP}"
  [ -f "$src" ] || { fail "zip not found: $src"; return 1; }
  ps3_ftp_up || { fail "PS3 FTP unreachable — is the PS3 on with webMAN active?"; return 2; }
  curl -s -m 120 -T "$src" "ftp://$PS3_HOST$PS3_ZIP_PATH" -u anonymous: 2>/dev/null \
    && ok "uploaded $src" || { fail "upload failed"; return 1; }
  # verify: re-download + compare hash
  curl -s -m 60 "ftp://$PS3_HOST$PS3_ZIP_PATH" -u anonymous: -o /tmp/ps3-check.zip 2>/dev/null
  local local_hash remote_hash
  local_hash=$(sha256sum "$src" | cut -d' ' -f1)
  remote_hash=$(sha256sum /tmp/ps3-check.zip | cut -d' ' -f1)
  [ "$local_hash" = "$remote_hash" ] && ok "hash verified ($local_hash)" \
    || { fail "hash mismatch: local=$local_hash remote=$remote_hash"; return 1; }
  return 0
}

# ── L2b: pull + scan Movian logs ─────────────────────────────────────────────
cmd_logs() {
  log "L2b — Movian logs"
  ps3_ftp_up || { fail "PS3 FTP unreachable"; return 2; }
  mkdir -p "$LOG_DIR"
  local i got=0
  for i in 0 1 2 3 4 5; do
    if curl -s -m 20 "ftp://$PS3_HOST/dev_hdd0/game/HTSS00003/USRDIR/cache/log/movian-$i.log" -u anonymous: -o "$LOG_DIR/movian-$i.log" 2>/dev/null; then
      got=$((got + 1))
    fi
  done
  ok "pulled $got log files"
  # scan ONLY the current log (movian-0) — rotation keeps older runs in movian-1..5
  local current="$LOG_DIR/movian-0.log"
  [ -f "$current" ] || { fail "no current log ($current)"; return 1; }
  grep -q "Settings initialized" "$current" \
    && ok "player initialized media (Settings initialized found)" \
    || warn "no 'Settings initialized' in current log — playback may not have started"
  local errs
  errs=$(grep -h "error\|Error\|HTTP error: 4\|HTTP error: 5" "$current" 2>/dev/null | grep -v "invalid_json" | head -5)
  if [ -n "$errs" ]; then
    fail "log errors found in current log:"; echo "$errs" | head -5; return 1
  fi
  ok "no HTTP 4xx/5xx in current log"
  [ "$VERBOSE" = "1" ] && warn "historical logs (movian-1..5) not scanned — use VERBOSE=1 to include them"
  return 0
}

# ── L2c: watch Jellyfin sessions for active playback ─────────────────────────
cmd_watch() {
  local secs="${1:-60}"
  log "L2c — watching Jellyfin sessions for ${secs}s (PlaybackInfo/Progress reported by plugin)"
  jf_up || { fail "Jellyfin unreachable or no API key"; return 2; }
  local probe="$REPO_DIR/scripts/jf-sessions.py"
  local t start=0 last_pos=-1 stable=0
  for ((t = 0; t < secs; t += 5)); do
    local state name pos method
    state=$(python3 "$probe" "$JF_HOST/Sessions?api_key=$JF_API_KEY")
    if [ "$state" != "NO_MOVIAN" ] && [ "$state" != "NO_DATA" ]; then
      name=$(echo "$state" | cut -d'|' -f1); pos=$(echo "$state" | cut -d'|' -f2)
      method=$(echo "$state" | cut -d'|' -f3)
      if [ "$pos" -gt 0 ] 2>/dev/null; then
        ok "PLAYING: '$name' | pos=${pos} ticks | method=$method"
        if [ "$pos" = "$last_pos" ]; then stable=$((stable + 1)); else stable=0; last_pos=$pos; fi
        [ $stable -ge 2 ] && { ok "position advancing — playback confirmed"; return 0; }
      else
        warn "Movian session idle (no position) — waiting..."
      fi
    else
      [ "$t" -eq 0 ] && warn "no active Movian session yet — waiting for playback to start..."
    fi
    sleep 5
  done
  fail "no advancing playback detected in ${secs}s — check the PS3 UI"; return 1
}

# ── status ───────────────────────────────────────────────────────────────────
cmd_status() {
  log "Environment status"
  ps3_ftp_up && ok "PS3 FTP reachable ($PS3_HOST)" || warn "PS3 FTP unreachable — PS3 off or webMAN inactive"
  jf_up && ok "Jellyfin API reachable + key OK" || warn "Jellyfin unreachable / no API key"
  [ -f "$BACKUP_ZIP" ] && ok "backup zip present ($(du -h "$BACKUP_ZIP" | cut -f1))" || warn "backup zip missing"
}

# ── all ──────────────────────────────────────────────────────────────────────
cmd_all() {
  local secs="${1:-90}"
  cmd_status
  cmd_build || return 1
  cmd_deploy || return $?
  echo
  log "Reload note: restart Movian on the PS3 (or use webMAN launch) then run:"
  echo "  $0 logs && $0 watch $secs"
  cmd_logs
  cmd_watch "$secs"
}

case "${1:-}" in
  build)  cmd_build ;;
  deploy) cmd_deploy ;;
  logs)   cmd_logs ;;
  watch)  cmd_watch "${2:-60}" ;;
  status) cmd_status ;;
  all)    cmd_all "${2:-90}" ;;
  *) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
