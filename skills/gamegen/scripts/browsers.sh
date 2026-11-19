#!/usr/bin/env bash
# The headless browsers play-tests leave running, and whether there's room
# for another. Each costs 1 to 3 GB (more with WebGL), so on a small machine
# two at once can run it out of memory.
#
#   browsers.sh                  one line per browser (its process ID, memory,
#                                and "left behind" if what started it has
#                                gone), then the free memory and whether
#                                there's room for another
#   browsers.sh close-left-behind  close Playwright's browsers marked "left
#                                behind" (by their own process IDs, never by name;
#                                BROWSERS_KILL stands in for kill in tests)
set -u

# Top-level headless browsers: not their helper processes (--type=...).
# Prints: pid ppid tree-memory-in-KB playwright(1/0)
list() {
  ps -eo pid=,ppid=,rss=,args= 2>/dev/null | awk '
    { pid[NR] = $1; ppid[NR] = $2; rss[NR] = $3; args = $0
      top[NR] = (args ~ /(chrome|chromium|headless_shell|chrome-headless-shell)/ && args ~ /--headless/ && args !~ /--type=/)
      pw[NR] = (args ~ /playwright/) }
    END {
      for (i = 1; i <= NR; i++) { parent[pid[i]] = ppid[i]; mem[pid[i]] = rss[i] }
      for (i = 1; i <= NR; i++) if (top[i]) {
        total = 0
        for (p in mem) { q = p; while (q != "" && q != 0 && q != 1) { if (q == pid[i]) { total += mem[p]; break } ; q = parent[q] } }
        print pid[i], ppid[i], total, pw[i]
      }
    }'
}

case "${1:-}" in
  "")
    biggest=0; n=0
    while read -r pid ppid kb pw; do
      [ -n "$pid" ] || continue
      n=$((n + 1)); [ "$kb" -gt "$biggest" ] && biggest=$kb
      note=""; [ "$ppid" = 1 ] && note=" (left behind)"
      echo "browser: $pid, $((kb / 1024)) MB$note"
    done <<EOF
$(list)
EOF
    echo "browsers: $n"
    if [ -r /proc/meminfo ]; then
      avail=$(awk '/^MemAvailable:/ { print $2 }' /proc/meminfo)
      total=$(awk '/^MemTotal:/ { print $2 }' /proc/meminfo)
      echo "memory: $((avail / 1024)) MB free of $((total / 1024)) MB"
      # Room if, after one more browser (as big as the biggest now, or 2 GB),
      # a tenth of the memory would still be free. One is always allowed.
      need=$biggest; [ "$need" -ge $((1024 * 1024)) ] || need=$((2 * 1024 * 1024))
      if [ "$n" -eq 0 ] || [ $((avail - need)) -gt $((total / 10)) ]; then
        echo "room for another: yes"
      else
        echo "room for another: no (wait for one to finish)"
      fi
    else
      echo "memory: unknown"
      if [ "$n" -eq 0 ]; then echo "room for another: yes"; else echo "room for another: no (one at a time here)"; fi
    fi
    ;;
  close-left-behind)
    closed=0
    while read -r pid ppid kb pw; do
      # Only Playwright's own browsers: never one another tool started.
      [ -n "$pid" ] && [ "$ppid" = 1 ] && [ "$pw" = 1 ] || continue
      ${BROWSERS_KILL:-kill} "$pid" 2>/dev/null && { echo "closed: $pid"; closed=$((closed + 1)); }
    done <<EOF
$(list)
EOF
    [ "$closed" -gt 0 ] || echo "closed: none"
    ;;
  *) echo "usage: browsers.sh [close-left-behind]"; exit 1 ;;
esac
