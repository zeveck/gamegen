#!/usr/bin/env bash
# The GitHub side of `/gamegen --publish`, so it runs the same way every time.
# Each command prints plain "label: value" lines; the skill reads them and
# explains the result to the person.
#
#   publish.sh settings                    the GAMEGEN_ settings, from the
#                                          environment or the nearest .env (only
#                                          those lines are read: never the keys)
#   publish.sh credit                      the name to credit the game to:
#                                          GAMEGEN_CREDIT, else the GitHub
#                                          profile name, else git's user.name
#   publish.sh check                       signed in to GitHub? prints the account
#   publish.sh repo <owner/name>           is that repo name free? if not, what's
#                                          there, and the next free name; a name
#                                          left by a rename says where it redirects
#   publish.sh dns <host> <owner>          does <host> point at GitHub Pages yet?
#   publish.sh dns-provider [domain]       is GAMEGEN_DNS set up, and can its key
#                                          manage <domain> (default:
#                                          GAMEGEN_DOMAIN)? Read-only
#   publish.sh dns-add <host> <owner>      add the CNAME <host> -> <owner>.github.io
#                                          at the GAMEGEN_DNS provider, if <host>
#                                          has no record yet (never overwrites)
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

# A GAMEGEN_ setting from the environment, or else the nearest .env (only
# that line is read: never the keys).
setting() {
  local value="${!1:-}" dir="$PWD"
  if [ -z "$value" ]; then
    while :; do
      if [ -f "$dir/.env" ]; then
        value="$(grep -E "^[[:space:]]*(export[[:space:]]+)?$1[[:space:]]*=" "$dir/.env" | tail -1 \
          | sed -E "s/^[^=]*=[[:space:]]*//; s/[[:space:]]+#.*$//; s/^[\"']//; s/[\"'][[:space:]]*$//")"
        break
      fi
      [ "$dir" = "/" ] && break
      dir="$(dirname "$dir")"
    done
  fi
  printf '%s' "$value"
}

# The DNS provider named by GAMEGEN_DNS (opt-in): prints the path of its
# script (dns-<provider>.sh), with its keys exported from .env, or exits with
# a plain reason. Each provider's keys are its own settings.
dns_provider() {
  provider="$(setting GAMEGEN_DNS | tr '[:upper:]' '[:lower:]')"
  [ -n "$provider" ] || die "dns provider: not set (GAMEGEN_DNS in .env; without it, publishing says which record to add)"
  case "$provider" in *[!a-z0-9-]*) die "dns provider: '$provider' isn't one gamegen knows (supported: godaddy)" ;; esac
  script="$(cd "$(dirname "$0")" && pwd)/dns-$provider.sh"
  [ -f "$script" ] || die "dns provider: '$provider' isn't one gamegen knows (supported: godaddy)"
  case "$provider" in
    godaddy) GODADDY_API_KEY="$(setting GODADDY_API_KEY)"; GODADDY_API_SECRET="$(setting GODADDY_API_SECRET)"
             export GODADDY_API_KEY GODADDY_API_SECRET ;;
  esac
}

# The domain in the provider's account that <host> belongs to (the longest
# match, so a.b.example.co.uk can work too), and <host>'s name within it.
dns_zone() { # host -> sets domain and name, or exits
  local rest="$1" rc out
  while :; do
    case "$rest" in *.*) ;; *) break ;; esac
    if [ "$rest" != "$1" ]; then
      out="$(bash "$script" access "$rest")"; rc=$?
      if [ $rc = 0 ]; then domain="$rest"; name="${1%."$rest"}"; return 0; fi
      [ $rc = 2 ] || die "$out"
    fi
    rest="${rest#*.}"
  done
  die "dns: $1 isn't under a domain in your $provider account (add its record by hand)"
}

cmd="${1:-}"; shift || true
case "$cmd" in
  settings)
    for name in GAMEGEN_DOMAIN GAMEGEN_GALLERY GAMEGEN_MAKING_OF GAMEGEN_CREDIT GAMEGEN_DNS; do
      value="$(setting "$name")"
      echo "$name: ${value:-not set}"
    done
    ;;

  credit)
    # A suggestion only: the skill never invents a name, and confirms this
    # one before it goes public.
    if name="$(setting GAMEGEN_CREDIT)" && [ -n "$name" ]; then from=GAMEGEN_CREDIT
    elif command -v gh >/dev/null 2>&1 && name="$(gh api user --jq '.name // .login' 2>/dev/null)" && [ -n "$name" ]; then from=github
    elif name="$(git config user.name 2>/dev/null)" && [ -n "$name" ]; then from=git
    else echo "credit: not known"; exit 0; fi
    echo "credit: $name"
    echo "from: $from"
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
    lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
    lookup() { # owner/name -> prints the details; returns 1 if free, 2 if unsure
      local out
      if out="$(gh repo view "$1" --json nameWithOwner,visibility,description,pushedAt \
        --jq '"\(.nameWithOwner)\t\(.visibility|ascii_downcase) | \(.description // "") | \(.pushedAt[:10])"' 2>&1)"; then
        local actual="${out%%$'\t'*}"
        # (tr, not ${x,,}: macOS's own bash is 3.2, which doesn't have it.)
        if [ "$(lower "$actual")" != "$(lower "$1")" ]; then printf '%s' "$actual"; return 1; fi
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

  dns-provider)
    dns_provider
    domain="${1:-$(setting GAMEGEN_DOMAIN)}"
    case "$domain" in ""|github.io) die "dns provider: $provider (give a domain to check, such as: dns-provider example.com)" ;; esac
    # A full host (pp3.example.com) works too: it's checked against its domain.
    dns_zone "x.$domain"
    echo "dns provider: $provider (can manage $domain)"
    ;;

  dns-add)
    host="${1:?dns-add needs a host}"; owner="${2:?dns-add needs the GitHub account}"
    dns_provider
    case "$host" in *.*.*) ;; *) die "dns: $host is a bare domain, which needs A records; add them by hand ($PAGES_IPS)" ;; esac
    target="$owner.github.io"
    dns_zone "$host"
    records="$(bash "$script" lookup "$domain" "$name")" || { echo "$records"; exit 1; }
    want="$(printf 'CNAME %s' "$target" | tr '[:upper:]' '[:lower:]')"
    have="$(printf '%s\n' "$records" | sed 's/\.$//' | tr '[:upper:]' '[:lower:]' | sed '/^$/d')"
    if [ "$have" = "$want" ]; then echo "dns: already there (CNAME $host -> $target)"; exit 0; fi
    if [ -n "$have" ]; then
      die "dns: $host already has a record ($(printf '%s' "$records" | tr '\n' ';' | sed 's/;$//; s/;/; /g')), so it was left alone"
    fi
    out="$(bash "$script" add-cname "$domain" "$name" "$target")" || die "$out"
    echo "dns: added (CNAME $host -> $target at $provider); it can take a few minutes to reach everyone"
    ;;

  pages)
    full="${1:?pages needs owner/name}"; host="${2:-}"
    # Create the Pages site, or switch an existing one to the workflow. If
    # neither works, pass on GitHub's reason (such as a plan that can't publish
    # Pages from a private repo), never a guess.
    if ! err="$(gh api -X POST "repos/$full/pages" -f build_type=workflow 2>&1 >/dev/null)" \
      && ! gh api -X PUT "repos/$full/pages" -f build_type=workflow >/dev/null 2>&1; then
      reason="$(printf '%s' "$err" | head -1 | sed 's/^gh: //')"
      die "pages: couldn't turn on GitHub Pages for $full${reason:+ (GitHub said: $reason)}"
    fi
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

  *) die "usage: publish.sh settings | credit | check | repo <owner/name> | dns <host> <owner> | dns-provider [domain] | dns-add <host> <owner> | pages <owner/name> [host] | gallery-pages <owner/name> | https <owner/name>" ;;
esac
