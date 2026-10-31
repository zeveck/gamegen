#!/bin/bash
# devcontainer-plus status line: model | context | 5-hour limit | 7-day limit.
# Setup copies this to ~/.claude/statusline.sh on each build, unless that copy
# has been changed since (setup keeps a fingerprint of what it installed).
export LC_ALL=C
input=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  echo "statusline: jq not installed"
  exit 0
fi

IFS='|' read -r model ctx five week < <(
  printf '%s' "$input" | jq -r '[
    (.model.display_name // "Claude"),
    (.context_window.used_percentage // ""),
    (.rate_limits.five_hour.used_percentage // ""),
    (.rate_limits.seven_day.used_percentage // "")
  ] | map(tostring) | join("|")' 2>/dev/null
)

# bar LABEL PERCENT -> 10-cell colored bar + percentage, or "LABEL --"
bar() {
  local label=$1 p=$2
  if [ -z "$p" ]; then
    printf '%s --' "$label"
    return
  fi
  local n
  n=$(printf '%.0f' "$p" 2>/dev/null) || { printf '%s --' "$label"; return; }
  [ "$n" -gt 100 ] && n=100
  [ "$n" -lt 0 ] && n=0
  local filled=$(( (n * 10 + 50) / 100 )) color i full="" empty=""
  if [ "$n" -ge 80 ]; then color=31
  elif [ "$n" -ge 50 ]; then color=33
  else color=32; fi
  for ((i = 0; i < filled; i++)); do full+="█"; done
  for ((i = filled; i < 10; i++)); do empty+="░"; done
  printf '%s \033[%sm%s\033[2m%s\033[0m %d%%' "$label" "$color" "$full" "$empty" "$n"
}

printf '%s | %s | %s | %s\n' \
  "${model:-Claude}" \
  "$(bar ctx "$ctx")" \
  "$(bar 5h "$five")" \
  "$(bar 7d "$week")"
