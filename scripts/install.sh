#!/bin/sh
# Install the launchd agent that keeps `coach serve` running on port 4340, and set up data/ as
# its own private git repo (every entry is committed there; the code repo ignores data/).
set -e
DIR=$(cd "$(dirname "$0")/.." && pwd)
NODE=$(command -v node)
mkdir -p "$DIR/data"
[ -d "$DIR/data/.git" ] || git -C "$DIR/data" init -q
PLIST="$HOME/Library/LaunchAgents/coach.serve.plist"
sed -e "s#__NODE__#$NODE#" -e "s#__DIR__#$DIR#g" -e "s#__HOME__#$HOME#g" "$DIR/scripts/coach.serve.plist" > "$PLIST"
launchctl bootout "gui/$(id -u)/coach.serve" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "coach.serve running on http://127.0.0.1:4340"
