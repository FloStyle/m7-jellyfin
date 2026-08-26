#!/usr/bin/env python3
"""jf-sessions.py — minimal Jellyfin session probe for the PS3 test harness.

Usage: jf-sessions.py <sessions-url-with-api-key>
Output:  NAME|POSITION_TICKS|PLAY_METHOD|IS_PAUSED   (for the first active Movian session)
         NO_MOVIAN  (no Movian session)
         NO_DATA    (unparseable/empty response)
Exit: 0 on any valid parse, 1 on transport error.
"""
import json
import sys
import urllib.request

def main():
    if len(sys.argv) < 2:
        print("NO_DATA")
        return 1
    url = sys.argv[1]
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            body = r.read().decode("utf-8", "replace")
    except Exception:
        print("NO_DATA")
        return 1
    try:
        sessions = json.loads(body)
    except Exception:
        print("NO_DATA")
        return 1
    for s in sessions:
        if s.get("Client") != "Movian":
            continue
        np = s.get("NowPlayingItem") or {}
        ps = s.get("PlayState") or {}
        name = np.get("Name", "?")
        pos = ps.get("PositionTicks", 0)
        method = ps.get("PlayMethod", "?")
        paused = ps.get("IsPaused", False)
        print("{}|{}|{}|{}".format(name, pos, method, paused))
        return 0
    print("NO_MOVIAN")
    return 0

if __name__ == "__main__":
    sys.exit(main())
