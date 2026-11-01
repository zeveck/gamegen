#!/usr/bin/env bash
# Checks that everything /gamegen needs is ready, before anything is spent.
#
# Each API key is tested with a free request: listing models (OpenAI, Gemini)
# or reading the account's subscription (ElevenLabs). Keys come from the
# environment, or from the nearest .env file in the current folder or above
# it. Key values are never printed, and they're passed to curl on standard
# input so they don't appear in the process list either.
#
# With --3d (a 3D game) it also checks MESHY_API_KEY, for meshgen; 2D games
# never need it, so it isn't looked at otherwise.
#
# Prints one line per check and exits 0 only when every check passes.
set -u
three_d=0
[ "${1:-}" = "--3d" ] && three_d=1

# The nearest .env, searching up from here.
envfile=""
dir="$PWD"
while :; do
  if [ -f "$dir/.env" ]; then envfile="$dir/.env"; break; fi
  [ "$dir" = "/" ] && break
  dir="$(dirname "$dir")"
done

# A key's value: the environment first, then the .env file.
key() {
  local name="$1" value="${!1:-}"
  if [ -z "$value" ] && [ -n "$envfile" ]; then
    value="$(grep -E "^[[:space:]]*(export[[:space:]]+)?$name[[:space:]]*=" "$envfile" | tail -1 \
      | sed -E "s/^[^=]*=[[:space:]]*//; s/[[:space:]]+#.*$//; s/^[\"']//; s/[\"'][[:space:]]*$//")"
  fi
  printf '%s' "$value"
}

status=0
fail() { echo "$1"; status=1; }

# GET a URL with one secret header; prints the HTTP status, saves the body.
get() { # url, header-line, body-file
  printf '%s\n' "$2" | curl -s -o "$3" -w '%{http_code}' --max-time 20 -H @- "$1"
}

verdict() { # label, http-code (the response body is in $body)
  # A restricted key can make art or sound but not the request this check
  # uses; that's not a reason to stop. (The body is searched, never printed.)
  if [ "$2" = 401 ] || [ "$2" = 403 ]; then
    if grep -q -i -E 'insufficient permissions|missing scopes|missing_permissions' "$body" 2>/dev/null; then
      echo "$1: ok (a restricted key: it works, but couldn't be fully checked)"
      return
    fi
  fi
  case "$2" in
    200) echo "$1: ok" ;;
    400|401|403) fail "$1: failed (the key was refused, HTTP $2)" ;;
    429) fail "$1: failed (rate limited or out of quota, HTTP 429)" ;;
    000) fail "$1: failed (couldn't reach the service)" ;;
    *) fail "$1: failed (HTTP $2)" ;;
  esac
}

body="$(mktemp)"
trap 'rm -f "$body"' EXIT

echo "env file: ${envfile:-none found}"

# OpenAI: imagegen2, and anim8gen through it.
k="$(key OPENAI_API_KEY)"
if [ -z "$k" ]; then fail "openai (imagegen2, anim8gen): missing OPENAI_API_KEY"
else verdict "openai (imagegen2, anim8gen)" "$(get https://api.openai.com/v1/models "Authorization: Bearer $k" "$body")"; fi

# Google Gemini: nanogen. It accepts GEMINI_API_KEY or GOOGLE_API_KEY.
k="$(key GEMINI_API_KEY)"; [ -z "$k" ] && k="$(key GOOGLE_API_KEY)"
if [ -z "$k" ]; then fail "gemini (nanogen): missing GEMINI_API_KEY"
else verdict "gemini (nanogen)" "$(get https://generativelanguage.googleapis.com/v1beta/models "x-goog-api-key: $k" "$body")"; fi

# ElevenLabs: audiogen. The subscription also says whether this is the free
# tier (whose audio must credit ElevenLabs) and how many credits are left.
k="$(key ELEVENLABS_API_KEY)"
if [ -z "$k" ]; then fail "elevenlabs (audiogen): missing ELEVENLABS_API_KEY"
else
  code="$(get https://api.elevenlabs.io/v1/user/subscription "xi-api-key: $k" "$body")"
  if [ "$code" = 200 ]; then
    python3 - "$body" <<'PY' || echo "elevenlabs (audiogen): ok"
import json, sys
d = json.load(open(sys.argv[1]))
tier = d.get("tier", "unknown")
used, limit = d.get("character_count"), d.get("character_limit")
left = f", {limit - used:,} of {limit:,} credits left" if isinstance(used, int) and isinstance(limit, int) else ""
print(f"elevenlabs (audiogen): ok (tier: {tier}{left})")
PY
  else verdict "elevenlabs (audiogen)" "$code"; fi
fi

# Meshy: meshgen, for 3D games only. The balance check is free and says how
# many credits are left.
if [ "$three_d" = 1 ]; then
  k="$(key MESHY_API_KEY)"
  if [ -z "$k" ]; then fail "meshy (meshgen): missing MESHY_API_KEY"
  else
    code="$(get https://api.meshy.ai/openapi/v1/balance "Authorization: Bearer $k" "$body")"
    if [ "$code" = 200 ]; then
      python3 - "$body" <<'PY' || echo "meshy (meshgen): ok"
import json, sys
b = json.load(open(sys.argv[1])).get("balance")
print(f"meshy (meshgen): ok ({b:,} credits left)" if isinstance(b, int) else "meshy (meshgen): ok")
PY
    else verdict "meshy (meshgen)" "$code"; fi
  fi
fi

# Node.js: the art and sound plugins' command-line tools.
if command -v node >/dev/null 2>&1; then echo "node: ok"
else fail "node: missing (install Node.js from nodejs.org)"; fi

# Python with Pillow: anim8gen's tools, and making app icons.
if ! command -v python3 >/dev/null 2>&1; then fail "python3: missing"
elif python3 -c "import PIL" 2>/dev/null; then echo "python3 + Pillow: ok"
else fail "python3 + Pillow: Pillow missing (python3 -m pip install --user pillow)"; fi

# Play-testing in a real browser.
if command -v playwright-cli >/dev/null 2>&1; then echo "playwright-cli: ok"
else echo "playwright-cli: not installed (play-testing falls back to npx playwright)"; fi

exit $status
