#!/usr/bin/env bash
set -euo pipefail

# Run a command quietly: its output appears only if it fails.
quiet() {
  local log
  log="$(mktemp)"
  if ! "$@" >"$log" 2>&1; then
    cat "$log" >&2
    rm -f "$log"
    return 1
  fi
  rm -f "$log"
}

# Install Claude Code CLI (native installer).
echo "🤖 Installing Claude Code..."
install_claude() { curl -fsSL https://claude.ai/install.sh | bash; }
quiet install_claude
export PATH="$HOME/.local/bin:$PATH"
echo "   $(claude --version)"

# Claude Code compacts a long conversation while you're away from it, so you
# can come back to a summary instead of the conversation you left. This turns
# that off, unless your settings already say either way. To leave it on,
# uncomment the next line and rebuild.
# KEEP_IDLE_COMPACTION=1
if [ -z "${KEEP_IDLE_COMPACTION:-}" ]; then
  python3 - "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json" 2>/dev/null <<'PY' || echo "   (couldn't change Claude's settings; idle compaction stays on)" >&2
import json, os, sys
path = sys.argv[1]
try:
    with open(path) as f: settings = json.load(f)
except FileNotFoundError:
    settings = {}
if "idleCompaction" not in settings:
    settings["idleCompaction"] = False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "w") as f: json.dump(settings, f, indent=2); f.write("\n")
    os.replace(path + ".tmp", path)
if settings["idleCompaction"] is False:
    print("   Idle compaction is off: Claude won't compact a conversation while you're away.")
    print("   (To keep it on, see KEEP_IDLE_COMPACTION in .devcontainer/setup.sh.)")
PY
fi

# A status line for Claude Code: model | context used | 5-hour limit | 7-day
# limit, each as a bar. Turned on only if your Claude settings don't already
# have a status line. To leave it out, uncomment the next line and rebuild.
# NO_STATUSLINE=1
if [ -z "${NO_STATUSLINE:-}" ]; then
  python3 - "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" "$(dirname "$0")/statusline.sh" 2>/dev/null <<'PY' || echo "   (couldn't set up the status line)" >&2
import hashlib, json, os, shutil, sys
config, source = sys.argv[1], sys.argv[2]
script = os.path.join(config, "statusline.sh")
mark = os.path.join(config, ".statusline.sh.installed")
digest = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
os.makedirs(config, exist_ok=True)
# Install, or refresh a copy we installed that hasn't been changed since.
untouched = os.path.exists(mark) and os.path.exists(script) and open(mark).read().strip() == digest(script)
if not os.path.exists(script) or untouched:
    shutil.copyfile(source, script)
    os.chmod(script, 0o755)
    with open(mark, "w") as f: f.write(digest(script) + "\n")
path = os.path.join(config, "settings.json")
try:
    with open(path) as f: settings = json.load(f)
except FileNotFoundError:
    settings = {}
if "statusLine" not in settings and os.path.exists(mark):
    settings["statusLine"] = {"type": "command", "command": "bash " + script}
    with open(path + ".tmp", "w") as f: json.dump(settings, f, indent=2); f.write("\n")
    os.replace(path + ".tmp", path)
    print("   Status line on: model, context used, and your 5-hour and 7-day limits.")
    print("   (To leave it out, see NO_STATUSLINE in .devcontainer/setup.sh.)")
PY
fi

# ── npm registry (optional) ──────────────────────────────────────────────────
if [ -n "${NPM_REGISTRY:-}" ]; then
  echo "Configuring npm registry: $NPM_REGISTRY"
  npm config set registry "$NPM_REGISTRY"
fi

# Install Codex CLI (it picks its model at run time, not at install).
echo "🧠 Installing Codex CLI..."
quiet npm install -g @openai/codex@latest
echo "   $(codex --version)"

# Install Gemini CLI. Newer npm skips the install scripts of two optional
# dependencies and warns; Gemini doesn't need them here. node-pty is a fallback
# for the prebuilt @lydell/node-pty it uses, and without keytar it keeps its
# key in ~/.gemini/gemini-credentials.json, which a container needs anyway
# (there is no system keychain) and which on-create.sh deletes on rebuild.
echo "✨ Installing Gemini CLI..."
quiet npm install -g @google/gemini-cli@latest
echo "   gemini $(gemini --version)"

# Install the GitLab CLI (glab).
# gh comes from the github-cli devcontainer feature, but glab has no official
# feature, so fetch the release binary directly. The version is resolved at build
# time rather than pinned, and the architecture comes from dpkg, so this works on
# both x86_64 and ARM (Apple Silicon) containers.
#
# Non-fatal on purpose: glab is a convenience, and gitlab.com may be unreachable
# on restricted networks. A failure here should not cost you the agents and
# browser stack that are the point of this container.
echo "🦊 Installing GitLab CLI (glab)..."
if ! (
  set -e
  GLAB_ARCH="$(dpkg --print-architecture)"
  GLAB_URL="$(curl -fsSL --max-time 30 \
    'https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases?per_page=1' \
    | python3 -c "import json,sys;d=json.load(sys.stdin)[0];print(next(l['url'] for l in d['assets']['links'] if l['name'].endswith('linux_${GLAB_ARCH}.tar.gz')))")"
  curl -fsSL --max-time 180 "$GLAB_URL" -o /tmp/glab.tar.gz
  # No --strip-components: the tarball's bin/glab must land in /usr/local/bin.
  sudo tar -xzf /tmp/glab.tar.gz -C /usr/local bin/glab
  rm -f /tmp/glab.tar.gz
); then
  echo "⚠️  glab install failed (network or upstream change) — continuing without it."
fi

# Put the auth helper on PATH so `auth` works from anywhere in the container.
# Symlinked rather than copied so edits to the repo copy take effect immediately.
# chmod first: exec bits are committed, but common transports strip them --
# raw-file downloads, some ZIP extractors, and any Windows filesystem hop --
# so restore them rather than trust the copy arrived intact.
echo "🔑 Installing auth helper..."
chmod +x .devcontainer/auth .devcontainer/dc 2>/dev/null || true
sudo ln -sf "$(pwd)/.devcontainer/auth" /usr/local/bin/auth

# Install Playwright CLI globally.
echo "🔧 Installing Playwright CLI..."
npm install -g @playwright/cli@latest

# Write Playwright CLI config to the default discovery path (.playwright/cli.config.json).
# --no-sandbox is required because Chromium's sandbox needs CAP_SYS_ADMIN which Docker
# containers don't have; the container itself provides isolation.
# We write this BEFORE `playwright-cli install` so it finds our config and doesn't
# overwrite it with a default that lacks --no-sandbox.
echo "📝 Writing Playwright CLI config..."
mkdir -p .playwright
cat > .playwright/cli.config.json <<JSON
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "headless": true,
      "args": ["--no-sandbox"]
    }
  },
  "outputDir": ".playwright/output"
}
JSON

# Initialize the workspace and install skills into .claude/skills/playwright-cli/.
# Browser download is handled explicitly by `install-browser` below, not relied on here
# (whether `install` also fetches one has varied across releases, and we pin @latest).
echo "📝 Initializing Playwright CLI workspace and installing skills..."
playwright-cli install --skills

# Install the browser AND its OS-level dependencies in one step.
# `install-browser` fetches the exact revision the CLI's bundled playwright-core pins
# (currently chromium-1224) plus the headless shell and ffmpeg (needed for video
# recording), and is idempotent. `--with-deps` adds the OS packages Docker lacks
# (libgbm, libnss3, etc) via apt.
#
# Do NOT add a separate `npx playwright install --with-deps chromium` here: stable
# playwright pins a DIFFERENT revision (1234), so it downloads ~656 MB of browsers
# that are never launched. PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 does not prevent this —
# that variable is only read by the npm-postinstall path, not the explicit `install`.
#
# We use chromium (not chrome) because it has native ARM Linux builds, so this works
# on Apple Silicon containers too.
# Remove Yarn repo with expired GPG key (from base image) to avoid apt failures.
echo "🌐 Installing Chromium and OS dependencies for Playwright CLI..."
sudo rm -f /etc/apt/sources.list.d/yarn.list 2>/dev/null || true
playwright-cli install-browser chromium --with-deps

# Self-check: fail the build LOUDLY if the browser can't actually launch, so any
# future upstream change to the install flow surfaces here (set -e aborts on the
# non-zero exit) instead of silently breaking tests/screenshots at runtime.
echo "🔎 Verifying Chromium launches..."
playwright-cli open about:blank >/dev/null
playwright-cli close >/dev/null

# Done.
echo "✅ Setup complete."
