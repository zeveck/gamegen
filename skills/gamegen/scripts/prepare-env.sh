#!/usr/bin/env bash
# Sets up a .env for the person to paste their API keys into, when the setup
# check finds keys missing:
#
# - No .env in this folder or above it: copies the template here.
# - A .env that lacks some keys: adds a commented placeholder line for each
#   missing one, leaving everything already in the file untouched.
# - Either way: makes sure .env is listed in the .gitignore next to it.
# - A .env outside the project (above its git repository, or in the home
#   folder or above it, such as ~/.env) is left alone.
#
# Never reads or prints key values. Prints what it did, ending with the path
# of the .env to fill in.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
template="$here/../templates/env"

# The nearest .env, searching up from here (the same search check-setup.sh does).
envfile=""
dir="$PWD"
while :; do
  if [ -f "$dir/.env" ]; then envfile="$dir/.env"; break; fi
  [ "$dir" = "/" ] && break
  dir="$(dirname "$dir")"
done

# Don't edit a .env that belongs to a wider setup, or put a .gitignore beside
# it: inside a git repository, one above the repository; otherwise, one in the
# home folder or above it (such as ~/.env).
if [ -n "$envfile" ]; then
  envdir="$(dirname "$envfile")"
  leave=0
  if repo="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    case "$envdir/" in "$repo"/*) ;; *) leave=1 ;; esac
  else
    case "${HOME:-/nonexistent}/" in "$envdir"/*) leave=1 ;; esac
  fi
  if [ "$leave" = 1 ]; then
    echo "found: $envfile (outside this project, so it's left as is)"
    echo "fill in: $envfile (add any missing keys there)"
    exit 0
  fi
fi

if [ -z "$envfile" ]; then
  envfile="$PWD/.env"
  cp "$template" "$envfile"
  chmod 600 "$envfile"
  echo "created: $envfile"
else
  # A key counts as present if it has a line at all, even an empty one.
  has() { grep -q -E "^[[:space:]]*(export[[:space:]]+)?$1[[:space:]]*=" "$envfile"; }
  gemini_present=0
  has GEMINI_API_KEY && gemini_present=1
  has GOOGLE_API_KEY && gemini_present=1
  added=""
  add() { # key, comment
    # Make sure the file ends with a newline before appending.
    [ -s "$envfile" ] && [ -n "$(tail -c1 "$envfile")" ] && echo >> "$envfile"
    printf '\n# %s\n%s=\n' "$2" "$1" >> "$envfile"
    added="$added $1"
  }
  has OPENAI_API_KEY || add OPENAI_API_KEY "OpenAI, for characters, sprites and animations: https://platform.openai.com/api-keys"
  [ "$gemini_present" = 1 ] || add GEMINI_API_KEY "Google Gemini, for backgrounds, scenery and items: https://aistudio.google.com/apikey"
  has ELEVENLABS_API_KEY || add ELEVENLABS_API_KEY "ElevenLabs, for music and sound effects: https://elevenlabs.io/app/developers/api-keys"
  if [ -n "$added" ]; then echo "added placeholders for:$added"; else echo "no placeholders needed"; fi
fi

# Keep it out of git: list .env in the .gitignore beside it.
gitignore="$(dirname "$envfile")/.gitignore"
if [ -f "$gitignore" ] && grep -q -x -E '/?\.env' "$gitignore"; then
  echo ".gitignore: already lists .env"
else
  if [ -s "$gitignore" ] && [ -n "$(tail -c1 "$gitignore")" ]; then echo >> "$gitignore"; fi
  printf '.env\n' >> "$gitignore"
  echo ".gitignore: added .env ($gitignore)"
fi

echo "fill in: $envfile"
