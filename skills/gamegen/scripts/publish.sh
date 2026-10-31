#!/usr/bin/env bash
# The GitHub side of `/gamegen --publish`, so it runs the same way every time.
# Each command prints plain "label: value" lines; the skill reads them and
# explains the result to the person.
#
#   publish.sh settings                    the GAMEGEN_ settings, from the
#                                          environment or the nearest .env (only
#                                          those lines are read: never the keys)
#   publish.sh check                       signed in to GitHub? prints the account
#   publish.sh repo <owner/name>           is that repo name free? if not, what's
#                                          there, and the next free name; a name
#                                          left by a rename says where it redirects
#   publish.sh dns <host> <owner>          does <host> point at GitHub Pages yet?
#   publish.sh pages <owner/name> [host]   turn on Pages (from the workflow), set
#                                          the custom address, the repo's homepage
#   publish.sh gallery-pages <owner/name>  turn on Pages for a new gallery,
#                                          served straight from its main branch
#   publish.sh https <owner/name>          wait for the certificate, then make
#                                          HTTPS required (PUBLISH_WAIT seconds,
#                                          default 540, under a 10-minute call)
set -u

die() { echo "$1"; exit 1; }

# GitHub Pages serves every custom domain from these four addresses.
PAGES_IPS="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"

cmd="${1:-}"; shift || true
case "$cmd" in
  settings)
    envfile=""; dir="$PWD"
    while :; do
      if [ -f "$dir/.env" ]; then envfile="$dir/.env"; break; fi
      [ "$dir" = "/" ] && break
      dir="$(dirname "$dir")"
    done
    for name in GAMEGEN_DOMAIN GAMEGEN_GALLERY GAMEGEN_MAKING_OF; do
      value="${!name:-}"
      if [ -z "$value" ] && [ -n "$envfile" ]; then
        value="$(grep -E "^[[:space:]]*(export[[:space:]]+)?$name[[:space:]]*=" "$envfile" | tail -1 \
          | sed -E "s/^[^=]*=[[:space:]]*//; s/[[:space:]]+#.*$//; s/^[\"']//; s/[\"'][[:space:]]*$//")"
      fi
      echo "$name: ${value:-not set}"
    done
    ;;

  check)
    command -v gh >/dev/null 2>&1 \
      || die "github: gh isn't installed (it comes with the dev container, or see cli.github.com)"
    login="$(gh api user --jq .login 2>/dev/null)" \
      || die "github: not signed in (run 'gh auth login', or 'auth' in the dev container)"
    echo "github: $login"
    ;;

  repo)
    full="${1:?repo needs owner/name}"
    # Only "Could not resolve" means free: any other failure (network, rate
    # limit) must not pass for a free name. A name that answers with another
    # repo's name is only a redirect left by a rename, and is free too.
    lookup() { # owner/name -> prints the details; returns 1 if free, 2 if unsure
      local out
      if out="$(gh repo view "$1" --json nameWithOwner,visibility,description,pushedAt \
        --jq '"\(.nameWithOwner)\t\(.visibility|ascii_downcase) | \(.description // "") | \(.pushedAt[:10])"' 2>&1)"; then
        local actual="${out%%$'\t'*}"
        if [ "${actual,,}" != "${1,,}" ]; then printf '%s' "$actual"; return 1; fi
        printf '%s' "${out#*$'\t'}"; return 0
      fi
      case "$out" in *"Could not resolve to a Repository"*) return 1 ;; *) return 2 ;; esac
    }
    info="$(lookup "$full")"; rc=$?
    [ $rc = 2 ] && die "repo: couldn't check whether $full exists; try again"
    if [ $rc = 1 ]; then
      if [ -n "$info" ]; then echo "free: $full (it redirects to $info, which using it ends)"
      else echo "free: $full"; fi
      exit 0
    fi
    echo "taken: $full ($info)"
    n=2
    while :; do
      lookup "$full-$n" >/dev/null; rc=$?
      [ $rc = 1 ] && break
      [ $rc = 2 ] && die "repo: couldn't check whether $full-$n exists; try again"
      n=$((n + 1))
    done
    echo "free: $full-$n"
    ;;

  dns)
    host="${1:?dns needs a host}"; owner="${2:?dns needs the GitHub account}"
    ips="$(python3 -c "import socket,sys
try: print(' '.join(sorted({a[4][0] for a in socket.getaddrinfo(sys.argv[1], 443, socket.AF_INET)})))
except OSError: pass" "$host")"
    # A subdomain needs a CNAME; a bare domain needs A records.
    case "$host" in
      *.*.*) record="a CNAME record: $host -> $owner.github.io" ;;
      *) record="A records for $host: $PAGES_IPS" ;;
    esac
    if [ -z "$ips" ]; then
      echo "dns: missing (add $record)"; exit 1
    fi
    for ip in $ips; do
      case " $PAGES_IPS " in *" $ip "*) ;; *)
        echo "dns: points elsewhere ($ips; it needs $record, or, behind a proxy such as Cloudflare's, the proxy turned off for it)"; exit 1 ;;
      esac
    done
    echo "dns: ok"
    ;;

  pages)
    full="${1:?pages needs owner/name}"; host="${2:-}"
    # Create the Pages site, or switch an existing one to the workflow.
    gh api -X POST "repos/$full/pages" -f build_type=workflow >/dev/null 2>&1 \
      || gh api -X PUT "repos/$full/pages" -f build_type=workflow >/dev/null 2>&1 \
      || die "pages: couldn't turn on GitHub Pages for $full"
    if [ -n "$host" ]; then
      gh api -X PUT "repos/$full/pages" -f cname="$host" >/dev/null 2>&1 \
        || die "pages: couldn't set the address $host (is it used by another repo?)"
    fi
    # GitHub reports a custom domain as http:// until HTTPS is required, so
    # build that address here.
    if [ -n "$host" ]; then url="https://$host/"
    else url="$(gh api "repos/$full/pages" --jq .html_url 2>/dev/null)"; fi
    [ -n "$url" ] || die "pages: turned on, but GitHub didn't report the address"
    gh repo edit "$full" --homepage "${url%/}" >/dev/null 2>&1 || true
    echo "url: $url"
    ;;

  gallery-pages)
    full="${1:?gallery-pages needs owner/name}"
    gh api -X POST "repos/$full/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null 2>&1 \
      || die "pages: couldn't turn on GitHub Pages for $full"
    url="$(gh api "repos/$full/pages" --jq .html_url 2>/dev/null)"
    [ -n "$url" ] || die "pages: turned on, but GitHub didn't report the address"
    gh repo edit "$full" --homepage "${url%/}" >/dev/null 2>&1 || true
    echo "url: $url"
    ;;

  https)
    full="${1:?https needs owner/name}"
    deadline=$(( $(date +%s) + ${PUBLISH_WAIT:-540} ))
    while :; do
      state="$(gh api "repos/$full/pages" --jq '.https_certificate.state // "none"' 2>/dev/null)"
      if [ "$state" = approved ] || [ "$state" = issued ]; then
        if gh api -X PUT "repos/$full/pages" -F https_enforced=true >/dev/null 2>&1; then
          echo "https: on"; exit 0
        fi
      fi
      case "$state" in errored|bad_authz|authorization_revoked)
        echo "https: stuck (certificate $state; remove the custom domain in the repo's Pages settings and add it back)"; exit 1 ;;
      esac
      if [ "$(date +%s)" -ge "$deadline" ]; then
        echo "https: still waiting (certificate $state; run --publish again in a few minutes)"; exit 2
      fi
      sleep "${PUBLISH_POLL:-15}"
    done
    ;;

  *) die "usage: publish.sh settings | check | repo <owner/name> | dns <host> <owner> | pages <owner/name> [host] | gallery-pages <owner/name> | https <owner/name>" ;;
esac
