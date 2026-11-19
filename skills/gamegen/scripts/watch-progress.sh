#!/usr/bin/env bash
# Watches a helper's progress file and exits once it hasn't changed for a
# while, so the coordinator (who started this in the background) hears about
# a stalled helper instead of waiting on a report that never comes.
#
#   watch-progress.sh <progress file> [minutes, default 30]
#
# Prints "stalled: <file> unchanged for N minutes" (or "missing: <file>"
# if it was never written) and exits. Stop it when the helper reports.
set -u
file="${1:?usage: watch-progress.sh <progress file> [minutes]}"
minutes="${2:-30}"
case "$minutes" in ''|*[!0-9]*) echo "usage: minutes must be a whole number"; exit 1 ;; esac
poll="${WATCH_POLL:-60}"
mtime() { stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null; }
start=$(date +%s)
while :; do
  now=$(date +%s)
  if [ -e "$file" ]; then
    m=$(mtime "$file")
    if [ $((now - m)) -ge $((minutes * 60)) ]; then
      echo "stalled: $file unchanged for $(( (now - m) / 60 )) minutes"; exit 0
    fi
  elif [ $((now - start)) -ge $((minutes * 60)) ]; then
    echo "missing: $file (never written in $minutes minutes)"; exit 0
  fi
  sleep "$poll"
done
