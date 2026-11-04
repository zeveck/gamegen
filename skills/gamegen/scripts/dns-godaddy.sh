#!/usr/bin/env bash
# GoDaddy, for publish.sh's DNS commands (GAMEGEN_DNS=godaddy). Every DNS
# provider script answers the same three commands, so publish.sh can use any
# of them the same way:
#
#   dns-<provider>.sh access <domain>               is <domain> in this account,
#                                                   and may this key manage it?
#   dns-<provider>.sh lookup <domain> <name>        the records at <name>, one
#                                                   "TYPE value" line each
#   dns-<provider>.sh add-cname <domain> <name> <target>
#                                                   add one CNAME record, and
#                                                   change nothing else
#
# Exit 0 on success; otherwise exit 1 with one plain line saying why (exit 2
# from access: the domain isn't in this account). The keys come from the
# environment (publish.sh reads them from .env), never from the command line,
# and are never printed: GODADDY_API_KEY and GODADDY_API_SECRET.
set -u

die() { echo "$1"; exit "${2:-1}"; }

base="${GODADDY_API_BASE:-https://api.godaddy.com}"
[ -n "${GODADDY_API_KEY:-}" ] && [ -n "${GODADDY_API_SECRET:-}" ] \
  || die "godaddy: GODADDY_API_KEY and GODADDY_API_SECRET aren't both set in .env"

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
# The key goes to curl in a private file, so it isn't in the process list.
umask 077
printf 'Authorization: sso-key %s:%s\nContent-Type: application/json\nAccept: application/json\n' \
  "$GODADDY_API_KEY" "$GODADDY_API_SECRET" > "$tmp/headers"

# api METHOD PATH [BODY]: prints the HTTP status; the response is in $tmp/body.
api() {
  if [ -n "${3:-}" ]; then
    printf '%s' "$3" | curl -s -o "$tmp/body" -w '%{http_code}' --max-time 30 \
      -X "$1" -H @"$tmp/headers" --data-binary @- "$base$2"
  else
    curl -s -o "$tmp/body" -w '%{http_code}' --max-time 30 -X "$1" -H @"$tmp/headers" "$base$2" < /dev/null
  fi
}

# GoDaddy's own words for an error, from its JSON reply.
reason() {
  python3 -c 'import json,sys
try: d = json.load(open(sys.argv[1])); print(d.get("message") or d.get("code") or "")
except Exception: print("")' "$tmp/body"
}

refused() { # http-code -> exits with a plain reason
  case "$1" in
    401) die "godaddy: the key was refused (check GODADDY_API_KEY and GODADDY_API_SECRET; production keys, not test keys)" ;;
    403) die "godaddy: this account can't use GoDaddy's DNS API ($(reason)). GoDaddy limits it to some accounts; its API support can say why" ;;
    429) die "godaddy: too many requests just now; try again in a minute" ;;
    000) die "godaddy: couldn't reach api.godaddy.com" ;;
    *) die "godaddy: HTTP $1 ($(reason))" ;;
  esac
}

cmd="${1:-}"; shift || true
case "$cmd" in
  access)
    domain="${1:?access needs a domain}"
    code="$(api GET "/v1/domains/$domain")"
    case "$code" in
      200) echo "access: ok ($domain)" ;;
      404|422) die "access: $domain isn't in this GoDaddy account" 2 ;;
      *) refused "$code" ;;
    esac
    ;;

  lookup)
    domain="${1:?lookup needs a domain}"; name="${2:?lookup needs a name}"
    for type in CNAME A AAAA; do
      code="$(api GET "/v1/domains/$domain/records/$type/$name")"
      [ "$code" = 200 ] || refused "$code"
      python3 -c 'import json,sys
for r in json.load(open(sys.argv[1])): print(sys.argv[2], r.get("data", ""))' "$tmp/body" "$type"
    done
    ;;

  add-cname)
    domain="${1:?add-cname needs a domain}"; name="${2:?add-cname needs a name}"; target="${3:?add-cname needs a target}"
    body="$(python3 -c 'import json,sys; print(json.dumps([{"type": "CNAME", "name": sys.argv[1], "data": sys.argv[2], "ttl": 3600}]))' "$name" "$target")"
    # PATCH adds records and leaves the rest alone. (A PUT here would replace
    # every record on the domain: never use it.)
    code="$(api PATCH "/v1/domains/$domain/records" "$body")"
    case "$code" in
      200|204) echo "added: CNAME $name.$domain -> $target" ;;
      *) refused "$code" ;;
    esac
    ;;

  *) die "usage: dns-godaddy.sh access <domain> | lookup <domain> <name> | add-cname <domain> <name> <target>" ;;
esac
