#!/usr/bin/env node
// dc — a small wrapper around @devcontainers/cli.
//
// All logic lives here so the platform shims (dc, dc.cmd) stay one line each and
// there is nothing to keep in sync between them.
//
// Runs on the HOST, not inside the container. Discovers the project by walking up
// from the current directory looking for .devcontainer/devcontainer.json, so the
// installed copy works in any project.

import { spawn, spawnSync, execFile } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync, chmodSync, readdirSync, readFileSync, renameSync, appendFileSync, linkSync, statSync, realpathSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, posix, resolve, win32 } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir, networkInterfaces, platform } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const IS_WIN = platform() === 'win32';
const LABEL = 'devcontainer.local_folder';

// ── pure helpers (unit-tested; see test/dc.test.mjs) ─────────────────────────

/** Walk up from `start` for a directory containing .devcontainer/devcontainer.json. */
export function findProjectRoot(start, exists = existsSync) {
  let dir = resolve(start);
  for (;;) {
    if (exists(join(dir, '.devcontainer', 'devcontainer.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Canonicalize a host path for comparison against the devcontainer.local_folder
 * label. Docker Desktop on Windows is inconsistent about slash direction and
 * drive-letter case, so compare normalized forms rather than raw strings.
 */
export function normalizeLocalFolder(p, plat = platform()) {
  if (!p) return '';
  let s = String(p).trim().replace(/\\/g, '/').replace(/\/+$/, '');
  if (plat === 'win32') {
    s = s.replace(/^([a-zA-Z]):/, (_m, d) => d.toLowerCase() + ':');
    s = s.toLowerCase();
  }
  return s;
}

/**
 * Build the argv for running a tool inside the container.
 *
 * A LOGIN shell is required: claude resolves via ~/.profile and codex/gemini/
 * playwright-cli via /etc/profile.d, neither of which a plain `devcontainer exec`
 * sources. Without -l these are "command not found".
 */
/**
 * Terminal capability vars to forward into the container.
 *
 * `devcontainer exec` passes nothing through by default, so a tool that renders
 * 256-colour or truecolour output degrades to the nearest 16-colour approximation
 * (Claude Code's orange turns red). VS Code sets these itself, which is why the
 * same tool looks right in its terminal. Windows shells set neither, so default
 * to values every modern terminal, including Windows Terminal, supports.
 *
 * These only advertise capability; they do not force colour on, so piped output
 * is unaffected -- tools still check isatty.
 */
export function terminalEnv(env = {}) {
  const out = [`TERM=${env.TERM || 'xterm-256color'}`, `COLORTERM=${env.COLORTERM || 'truecolor'}`];
  if (env.LANG) out.push(`LANG=${env.LANG}`);
  return out;
}

export function buildExecArgs(root, argv, { login = true, env = {} } = {}) {
  const base = ['exec', '--workspace-folder', root];
  for (const kv of terminalEnv(env)) base.push('--remote-env', kv);
  if (!login) return [...base, ...argv];
  const [cmd, ...rest] = argv;
  // `bash -lc '<script>' <argv0> <args...>` — argv0 fills $0 so "$@" is the real args.
  return [...base, 'bash', '-lc', `${cmd} "$@"`, cmd, ...rest];
}

/**
 * Message for a failed prerequisite, or null if everything needed is present.
 * Pure so the wording is unit-tested; the probing lives in preflight() below.
 */
export function preflightError(hasDocker, daemonRunning, plat = platform()) {
  const desktop = plat === 'win32' || plat === 'darwin';
  if (!hasDocker) {
    return 'Docker not found on PATH.\n'
      + (desktop
        ? '  Install Docker Desktop: https://www.docker.com/products/docker-desktop/'
        : '  Install Docker: https://docs.docker.com/engine/install/')
      + '\n  Then run `dc doctor` to verify.';
  }
  if (!daemonRunning) {
    return 'Docker is installed but not running.\n'
      + (desktop
        ? '  Start Docker Desktop and wait for it to report "running", then try again.'
        : '  Start the daemon (e.g. sudo systemctl start docker), then try again.')
      + '\n  `dc doctor` will confirm.';
  }
  return null;
}

/**
 * The per-project agent volumes devcontainer.json declares:
 * agent-<tool>-${devcontainerId}. A devcontainerId is 52 base-32 digits, so
 * matching that exact shape keeps dc away from every other volume.
 */
export const AGENT_TOOLS = ['claude', 'codex', 'gemini'];
export const AGENT_VOLUME = /^agent-(claude|codex|gemini)-[0-9a-v]{52}$/;

/**
 * ${devcontainerId} exactly as @devcontainers/cli computes it: SHA-256 of the
 * id labels as key-sorted JSON, written in base 32 and padded to 52 digits.
 */
export function devcontainerId(idLabels) {
  const json = JSON.stringify(idLabels, Object.keys(idLabels).sort());
  const hex = createHash('sha256').update(json, 'utf8').digest('hex');
  return BigInt(`0x${hex}`).toString(32).padStart(52, '0');
}

/**
 * The id labels the CLI gives a project's container: its folder and config
 * file. On Windows the CLI normalizes paths and lowercases the drive letter.
 */
export function idLabelsFor(root, plat = platform()) {
  const form = (p) => {
    if (plat !== 'win32') return p;
    const s = win32.normalize(p);
    return s.length >= 2 && s[1] === ':' ? s[0].toLowerCase() + s.slice(1) : s;
  };
  const join_ = plat === 'win32' ? win32.join : posix.join;
  return {
    'devcontainer.local_folder': form(root),
    'devcontainer.config_file': form(join_(root, '.devcontainer', 'devcontainer.json')),
  };
}

export const agentVolumeNames = (id) => AGENT_TOOLS.map((tool) => `agent-${tool}-${id}`);

/** Agent volume names among a container's mounts (docker inspect .Mounts). */
export function agentVolumesFromMounts(mounts) {
  return (mounts || [])
    .filter((m) => m && m.Type === 'volume' && AGENT_VOLUME.test(m.Name || ''))
    .map((m) => m.Name)
    .sort();
}

/** Agent volume names in a newline-separated `docker volume ls -q` listing. */
export function agentVolumesFromList(stdout) {
  return String(stdout || '').split('\n').map((s) => s.trim()).filter((n) => AGENT_VOLUME.test(n)).sort();
}

export function parseArgs(argv) {
  const flags = new Set();
  const rest = [];
  for (const a of argv) { if (a.startsWith('--')) flags.add(a); else rest.push(a); }
  return { flags, rest };
}

// ── process helpers ─────────────────────────────────────────────────────────

// DOCKER_CLI_HINTS=false suppresses Docker Desktop's "What's next: try docker
// debug ..." promo, which the docker CLI prints after commands the devcontainer
// CLI runs on our behalf -- noise in the middle of every `dc claude`.
const CHILD_ENV = { ...process.env, DOCKER_CLI_HINTS: 'false' };

/**
 * Quote one argument for a cmd.exe command line.
 *
 * Never rely on Node's shell:true here: it joins arguments UNQUOTED, so a space
 * splits an argument in two, and cmd.exe interprets a bare | or & as its own
 * operator. That silently dropped every multi-word argument on Windows -- the
 * login-shell wrapper, prompts passed to `dc claude`, paths with spaces, and
 * the tab-separated docker --format string.
 *
 * Standard MSVCRT rules: backslashes double only when they precede a quote;
 * embedded quotes become backslash-quote. Args with cmd metacharacters are
 * quoted too -- inside double quotes cmd leaves them alone.
 */
export function winQuote(a) {
  a = String(a);
  if (a === '') return '""';
  if (!/[\s"&|<>^%();=,]/.test(a)) return a;
  let out = '"', bs = 0;
  for (const ch of a) {
    if (ch === '\\') { bs++; continue; }
    if (ch === '"') { out += '\\'.repeat(bs * 2 + 1) + '"'; bs = 0; continue; }
    out += '\\'.repeat(bs) + ch; bs = 0;
  }
  return out + '\\'.repeat(bs * 2) + '"';
}

/**
 * Spawn a child with arguments passed intact.
 *
 * Tries a direct (no-shell) spawn first, which is exact on every OS. On Windows
 * that fails for .cmd shims (npm installs devcontainer/npx as .cmd, and Node
 * refuses to exec those without a shell), so fall back to cmd.exe with a
 * command line we quote ourselves via winQuote.
 */
export function spawnSmart(cmd, args, opts = {}) {
  // Tests stand in for docker with a Node script (works on every OS).
  if (cmd === 'docker' && process.env.DC_FAKE_DOCKER) {
    return spawnSync(process.execPath, [process.env.DC_FAKE_DOCKER, ...args], { ...opts, env: CHILD_ENV });
  }
  let r = spawnSync(cmd, args, { ...opts, env: CHILD_ENV });
  if (IS_WIN && r.error) {
    const line = '"' + [cmd, ...args].map(winQuote).join(' ') + '"';
    r = spawnSync('cmd.exe', ['/d', '/s', '/c', line],
      { ...opts, env: CHILD_ENV, windowsVerbatimArguments: true });
  }
  return r;
}

const run = (cmd, args, opts = {}) => spawnSmart(cmd, args, { stdio: 'inherit', ...opts });
const capture = (cmd, args) => spawnSmart(cmd, args, { encoding: 'utf8' });
// For docker rm/stop, which echo each id they act on; errors still show.
const runQuiet = (cmd, args) => spawnSmart(cmd, args, { stdio: ['inherit', 'ignore', 'inherit'] });

function has(cmd) {
  if (cmd === 'docker' && process.env.DC_FAKE_DOCKER) return true;
  const r = capture(IS_WIN ? 'where' : 'which', [cmd]);
  return r.status === 0;
}

/** Prefer a globally installed devcontainer binary; fall back to npx. */
function devcontainerCmd() {
  if (has('devcontainer')) return ['devcontainer', []];
  return ['npx', ['-y', '@devcontainers/cli@latest']];
}

function dc(args) {
  // Tests stand in for the devcontainer CLI with a Node script.
  if (process.env.DC_FAKE_DEVCONTAINER) {
    return spawnSync(process.execPath, [process.env.DC_FAKE_DEVCONTAINER, ...args], { stdio: 'inherit', env: CHILD_ENV }).status ?? 1;
  }
  const [cmd, prefix] = devcontainerCmd();
  return run(cmd, [...prefix, ...args]).status ?? 1;
}

/** Fail fast with a readable message instead of letting the CLI emit a stack trace. */
function preflight() {
  const hasDocker = has('docker');
  const daemon = hasDocker && capture('docker', ['info']).status === 0;
  const err = preflightError(hasDocker, daemon);
  if (err) { console.error(`dc: ${err}`); return false; }
  return true;
}

/** All agent volumes on this machine (or only those no container uses). */
function agentVolumesOnMachine({ danglingOnly = false } = {}) {
  const args = ['volume', 'ls', '-q', ...(danglingOnly ? ['--filter', 'dangling=true'] : [])];
  const r = capture('docker', args);
  return r.status === 0 ? agentVolumesFromList(r.stdout) : [];
}

/**
 * This project's agent volumes: those its containers mount, plus any whose
 * name matches the id the CLI derives from this folder. The second finds the
 * data after `dc rm`, when there is no container to ask. Only names that
 * exist are returned, so a path form the hash doesn't match finds nothing
 * rather than something wrong.
 */
function projectVolumes(root, containers) {
  const names = new Set();
  for (const c of containers) {
    const r = capture('docker', ['inspect', '--format', '{{json .Mounts}}', c.id]);
    if (r.status !== 0) continue;
    try { for (const n of agentVolumesFromMounts(JSON.parse(r.stdout))) names.add(n); } catch { /* skip */ }
  }
  const existing = new Set(agentVolumesOnMachine());
  for (const n of agentVolumeNames(devcontainerId(idLabelsFor(root)))) if (existing.has(n)) names.add(n);
  return [...names].sort();
}

/** Ask before deleting. --yes skips; without a terminal to ask on, refuse. */
async function confirm(question, flags) {
  if (flags.has('--yes')) return true;
  if (!process.stdin.isTTY) {
    console.error('dc: not going ahead without confirmation; rerun with --yes.');
    return false;
  }
  // Imported here so an old Node still reaches the friendly version check.
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return /^y(es)?$/i.test((await rl.question(`${question} [y/N] `)).trim()); }
  catch { process.stdout.write('\n'); return false; } // Ctrl+C / Ctrl+D at the prompt
  finally { rl.close(); }
}

/** Remove the containers, then the volumes (Docker refuses while a container uses them). */
function removeContainersAndVolumes(containers, volumes) {
  for (const c of containers) {
    if ((runQuiet('docker', ['rm', '-f', c.id]).status ?? 1) !== 0) {
      console.error(`dc: could not remove container ${c.id} (see above); nothing was deleted.`);
      return 1;
    }
  }
  if (!volumes.length) return 0;
  const status = runQuiet('docker', ['volume', 'rm', ...volumes]).status ?? 1;
  if (status !== 0) {
    console.error('dc: could not delete every volume (see above).'
      + (containers.length ? ' The container was removed; `dc up` starts it again.' : ''));
  }
  return status;
}

function listVolumes(volumes) {
  for (const v of volumes) console.log(`  ${v}`);
}

async function cmdPrune(flags) {
  const orphans = agentVolumesOnMachine({ danglingOnly: true });
  if (!orphans.length) { console.log('no unused agent volumes.'); return 0; }
  console.log('Agent volumes no container uses, from any project on this machine that was');
  console.log('moved, renamed, or removed with `dc rm` and not started again:');
  listVolumes(orphans);
  console.log('\nA project removed with `dc rm` picks its data up again on its next `dc up`;');
  console.log('deleting it here loses that history.');
  if (!(await confirm(`Delete these ${orphans.length} volume(s)?`, flags))) return 1;
  const status = runQuiet('docker', ['volume', 'rm', ...orphans]).status ?? 1;
  if (status === 0) console.log('Deleted.');
  else console.error('dc: could not delete every volume (see above).');
  return status;
}

async function cmdVolumes(root, flags) {
  const cs = findContainers(root);
  const volumes = projectVolumes(root, cs);
  if (!volumes.length) {
    console.log('this project has no saved agent data.');
    if (!cs.length) {
      const n = agentVolumesOnMachine({ danglingOnly: true }).length;
      if (n) console.log(`(${n} agent volume(s) on this machine are unused; \`dc volumes --prune\` lists them.)`);
    }
    return 0;
  }
  if (!flags.has('--rm')) {
    console.log('Saved agent data for this project (history, memory, settings, plugins; no sign-ins):');
    listVolumes(volumes);
    console.log(cs.length
      ? '\n`dc up --fresh` clears it and starts a new container. To delete it for good, `dc rm --volumes`.'
      : '\n`dc volumes --rm` deletes it.');
    return 0;
  }
  // Docker won't delete a volume a container still uses, even a stopped one,
  // and --rm deletes only data, so leave removing the container to the user.
  if (cs.length) {
    console.error('dc volumes: this project\'s container is still using its saved agent data.\n'
      + 'Run `dc rm --volumes` to remove the container and delete the data together.\n'
      + 'Or run `dc up --fresh` to clear the data and start a new container.');
    return 1;
  }
  if (!(await confirm('Delete this project\'s saved agent history (sessions, memory, settings, plugins)?', flags))) return 1;
  const status = removeContainersAndVolumes([], volumes);
  if (status === 0) console.log('Deleted. The next `dc up` starts with empty agent folders.');
  return status;
}

/** dc rm --volumes: remove the container and delete its agent data. */
async function cmdRmVolumes(root, flags) {
  const cs = findContainers(root);
  const volumes = projectVolumes(root, cs);
  if (!cs.length && !volumes.length) { reportNoMatch(root); return 0; }
  if (volumes.length) {
    const q = cs.length
      ? 'Remove this project\'s container and its agent history (sessions, memory, settings, plugins)?'
      : 'Delete this project\'s saved agent history (sessions, memory, settings, plugins)?';
    if (!(await confirm(q, flags))) return 1;
  }
  const status = removeContainersAndVolumes(cs, volumes);
  if (status === 0 && volumes.length) console.log('Deleted. The next `dc up` starts with empty agent folders.');
  return status;
}

// ── port forwarding ─────────────────────────────────────────────────────────
//
// `dc forward <port>` makes a port inside the container reachable at
// localhost:<port> on this machine, without a rebuild (Docker only publishes
// ports when it creates a container). A relay process in the background listens
// here and, per connection, runs `docker exec -i <container> node` to connect to
// the port from inside the container, piping bytes both ways. Because the
// connection ends inside the container, servers that listen only on localhost
// work too.
//
// The ports a project forwards are saved on this machine (not in the repo), keyed
// by the project's folder. There is at most one relay per project. It re-reads
// the list every POLL_MS and exits by itself once the list is empty, the
// project's container is no longer running, or Docker has been unreachable for a
// while, so stopping a forward never means killing a process by id. `dc up`
// starts it again.

const POLL_MS = 1500;
// A relay rewrites its state file every poll; one this old belongs to a relay
// that has died, even if its process id has since been reused.
const STALE_MS = 10000;
const DOCKER_GRACE_MS = Number(process.env.DC_RELAY_DOCKER_GRACE_MS) || 30000;

/** Where dc keeps per-machine state (DC_STATE_DIR overrides, for tests). */
export function stateDir(env = process.env, plat = platform()) {
  if (env.DC_STATE_DIR) return env.DC_STATE_DIR;
  if (plat === 'win32') return join(env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'dc', 'state');
  return join(env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'dc');
}

/** Port numbers from command-line words; throws on anything that isn't one. */
export function parsePorts(words) {
  return words.map((w) => {
    if (!/^\d{1,5}$/.test(w) || +w < 1 || +w > 65535) throw new Error(`not a port number: ${w}`);
    return +w;
  });
}

/**
 * State file paths for a project. Keyed by the normalized folder, the same form
 * findContainers matches on, so `C:\Code\Proj` and `c:\code\proj` share one list
 * and one relay.
 */
const forwardFiles = (root) => {
  const key = createHash('sha256').update(normalizeLocalFolder(root)).digest('hex').slice(0, 20);
  const dir = stateDir();
  return {
    dir,
    list: join(dir, `forwards-${key}.json`),
    lock: join(dir, `forwards-${key}.lock`),
    relay: join(dir, `relay-${key}.json`),
    log: join(dir, `relay-${key}.log`),
  };
};

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

/**
 * Write via a temp file and rename, so a reader never sees half a file. On
 * Windows a rename over a file another process has open (a reader, or antivirus)
 * can fail for a moment, so retry briefly.
 */
function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data));
  for (let i = 0; ; i++) {
    try { renameSync(tmp, path); return; } catch (e) {
      if (i >= 40 || !['EPERM', 'EACCES', 'EBUSY'].includes(e.code)) { rmSync(tmp, { force: true }); throw e; }
      sleepSync(25);
    }
  }
}

/** Run `fn` while holding the project's list lock, so concurrent edits don't lose one. */
function withListLock(root, fn) {
  const { lock, dir } = forwardFiles(root);
  mkdirSync(dir, { recursive: true });
  const end = Date.now() + 10000;
  for (;;) {
    try { writeFileSync(lock, String(process.pid), { flag: 'wx' }); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // A lock left by a dc that crashed mid-edit: edits take milliseconds.
      let age = 0;
      try { age = Date.now() - statSync(lock).mtimeMs; } catch { continue; }
      if (age > 5000) { rmSync(lock, { force: true }); continue; }
      if (Date.now() > end) throw new Error(`another dc is changing this project's forwards (lock: ${lock})`);
      sleepSync(30);
    }
  }
  try { return fn(); } finally { rmSync(lock, { force: true }); }
}

export function readForwards(root) {
  const d = readJson(forwardFiles(root).list);
  return Array.isArray(d?.ports) ? d.ports.filter((p) => Number.isInteger(p)) : [];
}

/** The forwarded ports opened to the network (`--network`), not just localhost. */
export function readNetworkForwards(root) {
  const d = readJson(forwardFiles(root).list);
  return Array.isArray(d?.network) ? d.network.filter((p) => Number.isInteger(p)) : [];
}

function writeForwards(root, ports, network = readNetworkForwards(root)) {
  const f = forwardFiles(root);
  const sorted = [...new Set(ports)].sort((a, b) => a - b);
  const wide = [...new Set(network)].filter((p) => sorted.includes(p)).sort((a, b) => a - b);
  if (sorted.length) writeJson(f.list, { root, ports: sorted, network: wide });
  else rmSync(f.list, { force: true });
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

const relayLive = (s) => s && pidAlive(s.pid) && Date.now() - (s.ts || 0) < STALE_MS;

/** The relay's last reported state, or null when no relay is running. */
function relayStatus(root) {
  const s = readJson(forwardFiles(root).relay);
  return relayLive(s) ? s : null;
}

function startRelay(root) {
  if (relayStatus(root)) return;
  const { dir } = forwardFiles(root);
  mkdirSync(dir, { recursive: true });
  // cwd: the home folder, not the project (or state) folder, which Windows
  // would refuse to move or delete while the relay runs.
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '__relay', root], {
    cwd: homedir(), detached: true, stdio: 'ignore', windowsHide: true, env: CHILD_ENV,
  });
  child.unref();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll the relay's state until `done(state)` holds or the time runs out. */
async function waitForRelay(root, done, ms = 15000) {
  const end = Date.now() + ms;
  for (;;) {
    const s = relayStatus(root);
    if (done(s) || Date.now() > end) return s;
    await sleep(150);
  }
}

/**
 * Make sure a relay is serving `ports`, and return its state once each port is
 * either listening or has failed. Starts a relay when none is running, and again
 * if one that was winding down (its container had stopped a moment ago) exits.
 */
async function ensureForwarding(root, ports, ms = 15000,
  ready = (st) => ports.every((p) => st.listening.includes(p) || st.errors[p])) {
  const end = Date.now() + ms;
  let started = 0;
  for (;;) {
    const s = relayStatus(root);
    if (!s && Date.now() - started > 2000) { startRelay(root); started = Date.now(); }
    if (s && ready(s)) return s;
    if (Date.now() > end) return s;
    await sleep(150);
  }
}

const runningContainer = (root) => findContainers(root).find((c) => c.state === 'running');

// Adapters other devices can't reach: WSL and Hyper-V (vEthernet), Docker, and
// virtual machine bridges.
const VIRTUAL_ADAPTER = /^(vEthernet|docker|br-|veth|virbr|vmnet|vboxnet|bridge)/i;

/**
 * This machine's IPv4 addresses that other devices on the network could use,
 * from os.networkInterfaces(). Leaves out virtual adapters and link-local
 * (169.254.x) addresses, unless that would leave nothing.
 */
export function lanAddresses(ifaces = networkInterfaces()) {
  const all = Object.entries(ifaces).flatMap(([name, list]) => (list || []).map((a) => ({ name, ...a })))
    .filter((a) => !a.internal && (a.family === 'IPv4' || a.family === 4));
  const real = all.filter((a) => !VIRTUAL_ADAPTER.test(a.name) && !a.address.startsWith('169.254.'));
  return (real.length ? real : all).map((a) => a.address);
}

/** One line per port: what it's doing right now. */
function describeForward(port, s) {
  const wide = s?.network?.includes(port);
  const where = wide ? `localhost:${port} and your network` : `localhost:${port}`;
  if (s?.listening?.includes(port)) return `${where} → container port ${port}`;
  if (s?.errors?.[port]) return `${where} not forwarded: ${s.errors[port]}`;
  return `${where} (starts with the container)`;
}

/** After listing, say how other devices reach any --network ports. */
function networkHint(ports, s) {
  const wide = ports.filter((p) => s?.network?.includes(p) && s.listening.includes(p));
  if (!wide.length) return;
  const addrs = lanAddresses();
  const eg = addrs.length ? addrs.slice(0, 3).map((a) => `http://${a}:${wide[0]}`).join(', ') : 'this machine\'s address';
  console.log(`Reachable from other devices on your network, e.g. ${eg}.`
    + ' If they can\'t connect, allow Node.js through this machine\'s firewall.');
}

/** Start the saved forwards for a running container and report them. */
async function resumeForwards(root) {
  const ports = readForwards(root);
  if (!ports.length || !runningContainer(root)) return;
  const s = await ensureForwarding(root, ports);
  for (const p of ports) {
    if (s?.listening?.includes(p)) console.log(`Forwarding ${describeForward(p, s)}.`);
    else console.error(`dc: ${describeForward(p, s)}`);
  }
  networkHint(ports, s);
  console.log('`dc forward --rm <port>` stops a forward.');
}

const nodeInContainer = (c) => capture('docker', ['exec', c.id, 'node', '--version']).status === 0;
const NO_NODE = 'dc forward: the container has no `node` on its PATH, which forwarding uses.\n'
  + 'The template installs it with the Node dev container feature.';

async function cmdForward(root, flags, rest) {
  let ports;
  try { ports = parsePorts(rest); } catch (e) { console.error(`dc forward: ${e.message}`); return 1; }

  if (flags.has('--rm')) {
    if (!ports.length) { console.error('dc forward --rm: name the port(s) to stop, e.g. `dc forward --rm 8999`.'); return 1; }
    const gone = withListLock(root, () => {
      const saved = readForwards(root);
      writeForwards(root, saved.filter((p) => !ports.includes(p)));
      return ports.filter((p) => saved.includes(p));
    });
    for (const p of ports.filter((x) => !gone.includes(x))) console.log(`${p} wasn't forwarded.`);
    if (!gone.length) return 0;
    await waitForRelay(root, (st) => !st || gone.every((p) => !st.listening.includes(p)));
    for (const p of gone) console.log(`Stopped forwarding ${p}.`);
    return 0;
  }

  const c = runningContainer(root);
  if (!ports.length) {
    const saved = readForwards(root);
    if (!saved.length) { console.log('No ports forwarded. `dc forward <port>` adds one.'); return 0; }
    // A running container with no relay (started by VS Code, say): start one.
    const s = c ? await ensureForwarding(root, saved) : { network: readNetworkForwards(root), listening: [], errors: {} };
    for (const p of saved) console.log(describeForward(p, s));
    networkHint(saved, s);
    return 0;
  }

  // Check before saving, so a container that can't forward isn't left with a
  // saved port that fails on every `dc up`.
  if (c && !nodeInContainer(c)) { console.error(NO_NODE); return 1; }
  // --network opens these ports to the network; without it they're (or go
  // back to being) localhost only.
  const wide = flags.has('--network');
  const narrowed = withListLock(root, () => {
    const was = readNetworkForwards(root);
    const network = wide ? [...was, ...ports] : was.filter((p) => !ports.includes(p));
    writeForwards(root, [...readForwards(root), ...ports], network);
    return wide ? [] : ports.filter((p) => was.includes(p));
  });
  for (const p of narrowed) console.log(`${p} is now forwarded to localhost only, not your network.`);
  if (!c) {
    console.log(`Saved. ${ports.join(', ')} will be forwarded when the container starts (\`dc up\`).`);
    return 0;
  }
  // Wait until the relay has each port open in the mode just asked for.
  const s = await ensureForwarding(root, ports, 15000,
    (st) => ports.every((p) => st.errors[p] || (st.listening.includes(p) && st.network.includes(p) === wide)));
  let status = 0;
  for (const p of ports) {
    if (s?.listening?.includes(p)) console.log(`Forwarding ${describeForward(p, s)}. \`dc forward --rm ${p}\` stops it.`);
    else { status = 1; console.error(`dc forward: ${describeForward(p, s)}`); }
  }
  networkHint(ports, s);
  if (!s) console.error(`dc forward: the forwarding process didn't start; see ${forwardFiles(root).log}`);
  return status;
}

// Runs inside the container for each forwarded connection: connect to the port
// on the container's own localhost and pipe stdin/stdout to it.
// - It tries 127.0.0.1, then ::1, itself. Node's automatic IPv4/IPv6 fallback
//   (autoSelectFamily on "localhost") was seen to stall on machines whose
//   loopback has no IPv6, so it isn't relied on.
// - It prints its pid to stderr, so the relay can stop it if the client goes
//   away while the server keeps the connection open.
// - allowHalfOpen, and ending stdout when the server ends: either side can
//   finish sending while the other carries on.
// - No process.exit: stdout to a pipe is written asynchronously, so exiting early
//   could drop the tail of the reply. Closing stdin lets node exit once it's sent.
const RELAY_INNER = [
  "process.stderr.write(process.pid+'\\n');",
  "const port=+process.argv[1];",
  "const go=(hosts)=>{",
  "const s=require('net').connect({port,host:hosts[0],allowHalfOpen:true});let up=false;",
  "s.once('connect',()=>{up=true;process.stdin.pipe(s);s.pipe(process.stdout,{end:false});",
  "s.on('end',()=>process.stdout.end());s.on('close',()=>process.stdin.destroy());});",
  "s.on('error',()=>{if(!up&&hosts.length>1)return go(hosts.slice(1));process.exitCode=1;process.stdin.destroy();});",
  "};go(['127.0.0.1','::1']);",
].join('');

function dockerSpawn(args, opts) {
  return process.env.DC_FAKE_DOCKER
    ? spawn(process.execPath, [process.env.DC_FAKE_DOCKER, ...args], { ...opts, env: CHILD_ENV, windowsHide: true })
    : spawn('docker', args, { ...opts, env: CHILD_ENV, windowsHide: true });
}

function dockerAsync(args) {
  const [cmd, pre] = process.env.DC_FAKE_DOCKER ? [process.execPath, [process.env.DC_FAKE_DOCKER]] : ['docker', []];
  return new Promise((res) => execFile(cmd, [...pre, ...args], { env: CHILD_ENV, windowsHide: true, timeout: 20000 },
    (err, stdout) => res(err ? null : String(stdout))));
}

/** The project's running container id; null if none; undefined if docker didn't answer. */
async function runningContainerAsync(root) {
  const out = await dockerAsync(['ps', '--filter', `label=${LABEL}`, '--filter', 'status=running',
    '--format', `{{.ID}}\t{{.Label "${LABEL}"}}`]);
  if (out === null) return undefined;
  const want = normalizeLocalFolder(root);
  const hit = out.split('\n').map((l) => l.split('\t')).find(([, folder]) => folder && normalizeLocalFolder(folder) === want);
  return hit ? hit[0] : null;
}

/**
 * Claim the project's relay slot. Hard-linking a complete temp file into place
 * is atomic and fails if the file exists, so no one ever sees an empty claim.
 * Returns false when a live relay already holds it.
 */
function claimRelay(f) {
  const tmp = `${f.relay}.${process.pid}.claim`;
  writeFileSync(tmp, JSON.stringify({ pid: process.pid, ts: Date.now(), listening: [], errors: {} }));
  try {
    for (let i = 0; i < 3; i++) {
      try { linkSync(tmp, f.relay); return true; } catch (e) {
        if (e.code !== 'EEXIST') { renameSync(tmp, f.relay); return true; } // no hard links here
        if (relayLive(readJson(f.relay))) return false;
        rmSync(f.relay, { force: true }); // a dead relay's leftover
      }
    }
    return false;
  } finally { rmSync(tmp, { force: true }); }
}

/** The background relay (`dc __relay <root>`). One per project. */
async function relayMain(root) {
  const f = forwardFiles(root);
  mkdirSync(f.dir, { recursive: true });
  if (!claimRelay(f)) return 0;
  writeFileSync(f.log, '');
  const log = (msg) => { try { appendFileSync(f.log, `${new Date().toISOString()} ${msg}\n`); } catch { /* ignore */ } };
  log(`relay ${process.pid} started for ${root}`);

  let container = null;
  const servers = new Map(); // port -> { list: net.Server[], network: boolean }
  const errors = {};
  const publish = () => {
    try {
      const listening = [...servers.keys()].sort((a, b) => a - b);
      const network = listening.filter((p) => servers.get(p).network);
      writeJson(f.relay, { pid: process.pid, ts: Date.now(), listening, network, errors });
    } catch (e) { log(`could not write state: ${e.message}`); }
  };

  const onConnection = (port) => (sock) => {
    const target = container;
    const child = dockerSpawn(['exec', '-i', target, 'node', '-e', RELAY_INNER, String(port)], { stdio: ['pipe', 'pipe', 'pipe'] });
    let innerPid = '';
    child.stderr.on('data', (d) => { if (innerPid.length < 16) innerPid += d; });
    if (process.env.DC_RELAY_TRACE) {
      const id = Math.random().toString(36).slice(2, 6);
      log(`[${id}] connection on ${port}`);
      sock.on('end', () => log(`[${id}] client finished sending`));
      sock.on('close', () => log(`[${id}] client socket closed`));
      child.stdout.on('data', (d) => log(`[${id}] ${d.length} bytes from container`));
      child.stdout.on('end', () => log(`[${id}] container side finished sending`));
      child.stderr.on('data', (d) => log(`[${id}] stderr: ${String(d).trim()}`));
      child.on('close', (code) => log(`[${id}] docker exec closed, code ${code}`));
    }
    sock.pipe(child.stdin);
    child.stdout.pipe(sock); // ends sock once the container side has sent everything
    child.on('close', (code) => {
      if (code) log(`connection to ${port} ended with docker exec exit code ${code}`);
      sock.end();
    });
    child.on('error', (e) => { log(`docker exec failed: ${e.message}`); sock.destroy(); });
    child.stdin.on('error', () => {});
    sock.on('error', () => {});
    // A client that closes looks, at first, like one that has only finished
    // sending (both send FIN), so its socket closes fully once the server next
    // writes to it. Servers that hold connections open (WebSockets, streams)
    // send heartbeats, which is when this cleanup runs.
    sock.on('close', () => {
      if (child.exitCode !== null) return;
      // The client is gone. Ending stdin lets the inner node finish; if the
      // server keeps its end open, stop it in the container.
      child.stdin.end();
      setTimeout(() => {
        if (child.exitCode !== null) return;
        const pid = parseInt(innerPid, 10);
        if (pid > 0) dockerSpawn(['exec', target, 'kill', String(pid)], { stdio: 'ignore' }).on('error', () => {});
        child.kill();
      }, 3000).unref();
    });
  };

  const listen = (port, host) => new Promise((res) => {
    // allowHalfOpen: a client that finishes sending still gets the reply.
    const srv = createServer({ allowHalfOpen: true }, onConnection(port));
    srv.once('error', (e) => res({ srv: null, err: e }));
    srv.listen(port, host, () => res({ srv, err: null }));
  });

  const BUSY = 'something on this machine is already using that port';
  const open = async (port, network) => {
    if (network) {
      // `::` takes IPv4 and IPv6 together; a host without IPv6 gets 0.0.0.0.
      let all = await listen(port, '::');
      if (!all.srv && all.err.code !== 'EADDRINUSE') all = await listen(port, '0.0.0.0');
      if (!all.srv) { errors[port] = all.err.code === 'EADDRINUSE' ? BUSY : all.err.message; return; }
      servers.set(port, { list: [all.srv], network: true });
      delete errors[port];
      log(`listening on ${port}, all addresses`);
      return;
    }
    const v4 = await listen(port, '127.0.0.1');
    if (!v4.srv) { errors[port] = v4.err.code === 'EADDRINUSE' ? BUSY : v4.err.message; return; }
    // Browsers may try ::1 for "localhost". A host server already on ::1 would
    // take those requests instead of the container, so that counts as busy; a
    // host without IPv6 just gets IPv4.
    const v6 = await listen(port, '::1');
    if (!v6.srv && v6.err.code === 'EADDRINUSE') { v4.srv.close(); errors[port] = BUSY; return; }
    servers.set(port, { list: v6.srv ? [v4.srv, v6.srv] : [v4.srv], network: false });
    delete errors[port];
    log(`listening on ${port}`);
  };

  const close = (port) => {
    for (const srv of servers.get(port)?.list || []) srv.close();
    servers.delete(port);
    log(`stopped ${port}`);
  };

  const shutdown = (why) => {
    log(`exiting: ${why}`);
    for (const port of [...servers.keys()]) close(port);
    if (readJson(f.relay)?.pid === process.pid) rmSync(f.relay, { force: true });
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (e) => { log(`error: ${e.stack || e}`); shutdown('error'); });
  process.on('unhandledRejection', (e) => { log(`error: ${e?.stack || e}`); shutdown('error'); });

  let dockerOk = Date.now();
  for (;;) {
    const wanted = readForwards(root);
    if (!wanted.length) shutdown('no ports to forward');
    const c = await runningContainerAsync(root);
    if (c === null) shutdown('container is not running');
    if (c === undefined) {
      if (Date.now() - dockerOk > DOCKER_GRACE_MS) shutdown('Docker is not answering');
    } else {
      dockerOk = Date.now();
      container = c;
      const wide = readNetworkForwards(root);
      // A port switched between localhost and --network is reopened in its new mode.
      for (const port of wanted) if (servers.has(port) && servers.get(port).network !== wide.includes(port)) close(port);
      for (const port of wanted) if (!servers.has(port)) await open(port, wide.includes(port));
      for (const port of [...servers.keys()]) if (!wanted.includes(port)) close(port);
      for (const port of Object.keys(errors)) if (!wanted.includes(+port)) delete errors[port];
    }
    // Another relay took over (say, after this one was suspended): step aside.
    const cur = readJson(f.relay);
    if (cur && cur.pid !== process.pid) shutdown('replaced by another relay');
    publish();
    await sleep(POLL_MS);
  }
}

// ── snapshots ───────────────────────────────────────────────────────────────
//
// `dc snapshot <name>` saves this project's agent volumes (~/.claude, ~/.codex,
// ~/.gemini) and the project folder; `dc restore <name>` puts them back exactly
// and starts a brand-new container from the cached image, which drops anything
// the work left inside the old container. The image is never saved: work never
// changes it.
//
// The copying runs in a throwaway container (`docker run --rm`) from the
// project's own image, so it's the same on every OS and needs nothing on the
// host but Docker. Snapshots live in dc's state folder, never in the project:
// they hold logins and .env files.

export const SNAPSHOT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;
const FALLBACK_HELPER_IMAGE = 'debian:stable-slim';
const STAGING = '.dc-restore-staging';

const projectKey = (root) => createHash('sha256').update(normalizeLocalFolder(root)).digest('hex').slice(0, 20);
const snapshotsDir = (root) => join(stateDir(), 'snapshots', projectKey(root));

/** True when the snapshots folder and the project folder overlap (restore would delete its own snapshot). */
export function overlaps(a, b, plat = platform()) {
  const x = normalizeLocalFolder(resolve(a), plat), y = normalizeLocalFolder(resolve(b), plat);
  return x === y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`);
}

/** One `--mount` value; a source with a comma or quote is quoted CSV-style. */
export function mountArg(type, source, target, readonly = false) {
  if (/[\r\n]/.test(source)) throw new Error(`can't use a path with a line break: ${JSON.stringify(source)}`);
  const field = (kv) => (/[",]/.test(kv) ? `"${kv.replace(/"/g, '""')}"` : kv);
  return [`type=${type}`, field(`source=${source}`), `target=${target}`, ...(readonly ? ['readonly'] : [])].join(',');
}

/** Run a shell script as root in a throwaway helper container. */
function helper(image, mounts, script) {
  const args = ['run', '--rm', '-u', '0', '--entrypoint', 'sh'];
  for (const m of mounts) args.push('--mount', m);
  args.push(image, '-c', script);
  return spawnSmart('docker', args, { encoding: 'utf8' });
}

// Prefer GNU tar's --numeric-owner (keeps file owners exact across images);
// fall back quietly where the helper's tar lacks it.
const TAR_N = 'N=; tar --numeric-owner --version >/dev/null 2>&1 && N=--numeric-owner;';

/**
 * The image to run helpers from, by ID (a tag can be pruned; the ID of a
 * container's image can't while the container exists): the project
 * container's, the one saved with the snapshot, or a small default, pulled if
 * needed. Returns null, with a message, if none can be had.
 */
function helperImage(containers, saved) {
  for (const c of containers) {
    const r = capture('docker', ['inspect', '--format', '{{.Image}}', c.id]);
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  if (saved && capture('docker', ['image', 'inspect', saved]).status === 0) return saved;
  if (capture('docker', ['image', 'inspect', FALLBACK_HELPER_IMAGE]).status === 0) return FALLBACK_HELPER_IMAGE;
  console.log(`Fetching a small helper image (${FALLBACK_HELPER_IMAGE}) for the copying...`);
  if (runQuiet('docker', ['pull', '-q', FALLBACK_HELPER_IMAGE]).status === 0) return FALLBACK_HELPER_IMAGE;
  console.error(`dc: couldn't get the helper image ${FALLBACK_HELPER_IMAGE} (it needs an internet connection the first time). Nothing was changed.`);
  return null;
}

/** The agent volumes the containers mount, by tool. */
function mountedVolumes(containers) {
  const byTool = {};
  for (const c of containers) {
    const r = capture('docker', ['inspect', '--format', '{{json .Mounts}}', c.id]);
    if (r.status !== 0) continue;
    try { for (const n of agentVolumesFromMounts(JSON.parse(r.stdout))) byTool[toolOf(n)] ??= n; } catch { /* skip */ }
  }
  return byTool;
}

// Archive a folder into /snap, readable only by the owner of the snapshots
// folder (the helper runs as root, which would otherwise own the file).
const save = (from, file) => `${TAR_N} umask 077 && tar $N --exclude=./${STAGING} -C ${from} -czf /snap/${file} . && `
  + `chown "$(stat -c %u:%g /snap)" /snap/${file} 2>/dev/null; true`;

/**
 * Put an archive back into a folder without ever leaving it half-empty: unpack
 * into a staging folder first (a damaged or oversized archive stops here, with
 * nothing touched), then clear everything else, keeping on past anything that
 * can't be removed, then copy the snapshot in over whatever remains. Anything
 * left that the snapshot doesn't have is listed as "left: <name>"; exit 4.
 * `exact` keeps owners and permissions (Linux file systems); without it, files
 * get the folder's usual owner (Docker Desktop's shared folders refuse chown).
 */
const refill = (target, archive, exact) => {
  const own = exact ? '$N -p' : '--no-same-owner --no-same-permissions';
  const S = `${target}/${STAGING}`;
  return `${TAR_N} rm -rf ${S} && mkdir ${S} && tar ${own} -C ${S} -xzf /snap/${archive} `
    + `|| { rm -rf ${S}; echo "couldn't unpack ${archive}" >&2; exit 3; }; `
    + `find ${target} -mindepth 1 -maxdepth 1 ! -name ${STAGING} -exec rm -rf {} + 2>/dev/null; `
    + `ls -A ${S} > /tmp/want; (cd ${S} && tar cf - .) | (cd ${target} && tar ${own} -xf -) `
    + `|| { echo "couldn't copy the snapshot in" >&2; rm -rf ${S}; exit 5; }; `
    + `rm -rf ${S}; extra=$(ls -A ${target} | grep -v -x -F -f /tmp/want); `
    + `[ -z "$extra" ] || { printf '%s\\n' "$extra" | sed 's/^/left: /' >&2; exit 4; }`;
};

const toolOf = (volume) => volume.match(AGENT_VOLUME)?.[1];
const humanSize = (bytes) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(0.1, bytes / 1e6).toFixed(1)} MB`);
const dirSize = (dir) => readdirSync(dir).reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
const PARTIAL = /\.(?:partial|old)-(\d+)$/;

function listSnapshots(root) {
  const dir = snapshotsDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => SNAPSHOT_NAME.test(n) && !PARTIAL.test(n) && existsSync(join(dir, n, 'snapshot.json')))
    .map((n) => ({ name: n, ...readJson(join(dir, n, 'snapshot.json')), bytes: dirSize(join(dir, n)) }))
    .sort((a, b) => String(a.created).localeCompare(String(b.created)));
}

function refuseOverlap(root, cmd) {
  if (!overlaps(snapshotsDir(root), root)) return false;
  console.error(`dc ${cmd}: snapshots would be kept inside the project (${snapshotsDir(root)}), where restoring would delete them. `
    + 'Point DC_STATE_DIR (or XDG_STATE_HOME) somewhere outside the project.');
  return true;
}

// Lists a container's processes as "comm args" lines, read from /proc so it
// works in any Linux container (no ps needed). Skips itself.
const PROCESS_LIST = 'for d in /proc/[0-9]*; do [ "${d#/proc/}" = "$$" ] && continue; '
  + 'c=$(cat "$d/comm" 2>/dev/null) || continue; a=$(tr "\\000\\n" "  " < "$d/cmdline" 2>/dev/null); '
  + 'case "$a" in *"/proc/[0-9]"*) continue ;; esac; printf "%s %s\\n" "$c" "$a"; done';

/**
 * What's running in a container, in plain words, from "comm args" lines
 * (PROCESS_LIST): friendly names where we know them, program names otherwise. The
 * container's own startup loop doesn't count, so an idle container gives "".
 */
export function describeActivity(lines) {
  const known = [];
  const other = [];
  for (const line of lines) {
    const [comm, ...rest] = line.trim().split(/\s+/);
    const args = rest.join(' ');
    if (!comm || /while sleep|^sleep$/.test(args) || /^(sleep|docker-init|tini|ps|cat|tr)$/.test(comm)) continue;
    if (comm === 'sh' && /while sleep/.test(args)) continue;
    let name = null;
    // Claude Code's native binary is named for its version (2.1.304), so its
    // helper processes show that instead of "claude".
    if (comm === 'claude' || /^\d+\.\d+\.\d+$/.test(comm) || /(^|\/)claude$/.test(args.split(' ')[0] || '')) name = 'a Claude session';
    else if (/@openai\/codex|\bcodex(\s|$)/.test(args)) name = 'a Codex session';
    else if (/@google\/gemini-cli|\bgemini(\s|$)/.test(args)) name = 'a Gemini session';
    else if (/vscode-server/.test(args)) name = 'VS Code';
    else if (/^(chrome|chromium|headless_shell)/.test(comm)) name = 'a browser';
    else if (/^(bash|zsh|sh|fish)$/.test(comm)) name = 'a shell';
    if (name) { if (!known.includes(name)) known.push(name); } else if (!other.includes(comm)) other.push(comm);
  }
  // Sessions first. A shell is how most other things start, so mention it only
  // when nothing else is running.
  const order = ['a Claude session', 'a Codex session', 'a Gemini session', 'VS Code', 'a browser'];
  const all = [...order.filter((n) => known.includes(n)), ...other];
  if (!all.length && known.includes('a shell')) all.push('a shell');
  if (!all.length) return '';
  const shown = all.length > 5 ? [...all.slice(0, 4), `${all.length - 4} more`] : all;
  return shown.length === 1 ? shown[0] : `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}`;
}

async function cmdSnapshot(root, flags, rest) {
  if (flags.has('--list')) {
    const snaps = listSnapshots(root);
    if (!snaps.length) { console.log('No snapshots yet. `dc snapshot <name>` makes one.'); return 0; }
    for (const s of snaps) console.log(`${s.name.padEnd(20)}  ${new Date(s.created).toLocaleString()}  ${humanSize(s.bytes)}`);
    return 0;
  }
  const name = rest[0];
  if (!name || !SNAPSHOT_NAME.test(name) || PARTIAL.test(name) || rest.length > 1) {
    console.error('dc snapshot: give one name, such as `dc snapshot clean` (letters, digits, dots, dashes, underscores; up to 40).');
    return 1;
  }
  const base = snapshotsDir(root);
  const dir = join(base, name);
  if (flags.has('--rm')) {
    if (!existsSync(dir)) { console.error(`dc snapshot: no snapshot named ${name}.`); return 1; }
    rmSync(dir, { recursive: true, force: true });
    console.log(`Deleted snapshot ${name}.`);
    return 0;
  }
  const replacing = existsSync(dir);
  if (replacing && !flags.has('--overwrite')) {
    console.error(`dc snapshot: ${name} already exists. Add --overwrite to replace it, or pick another name.`);
    return 1;
  }
  if (refuseOverlap(root, 'snapshot')) return 1;

  // Private to this user: snapshots hold logins and .env files. Sweep up
  // leftovers of snapshots that were interrupted.
  mkdirSync(base, { recursive: true, mode: 0o700 });
  for (const n of readdirSync(base)) {
    const m = n.match(PARTIAL);
    if (m && !pidAlive(Number(m[1]))) rmSync(join(base, n), { recursive: true, force: true });
  }

  const cs = findContainers(root);
  // Snapshotting stops a running container for a moment. If that would
  // interrupt something, say what and ask first; if it's idle, just go.
  const running = cs.filter((x) => x.state === 'running');
  if (running.length) {
    let lines = [];
    let looked = true;
    for (const c of running) {
      const r = capture('docker', ['exec', c.id, 'sh', '-c', PROCESS_LIST]);
      if (r.status !== 0) { looked = false; break; }
      lines = lines.concat(r.stdout.split('\n').filter(Boolean));
    }
    const what = looked ? describeActivity(lines) : '';
    if (!looked || what) {
      // Couldn't look inside? Ask anyway rather than assume it's idle.
      const q = looked
        ? `The container is running ${what}. Snapshotting stops it for a moment, which interrupts that. Go ahead?`
        : 'Snapshotting stops the container for a moment, which interrupts anything running in it. Go ahead?';
      if (!(await confirm(q, flags))) return 1;
    } else {
      console.log('Pausing the container while it copies...');
    }
  }
  const volumes = projectVolumes(root, cs);
  const image = helperImage(cs, null);
  if (!image) return 1;

  // Ctrl+C stops the copying (the helper container gets it too) but still
  // reaches the cleanup below, so the container isn't left stopped.
  let interrupted = false;
  const onInt = () => { interrupted = true; };
  process.on('SIGINT', onInt);
  const stopped = [];
  const tmp = `${dir}.partial-${process.pid}`;
  let ok = true;
  try {
    // Stop the container so nothing is half-written while it's copied.
    for (const c of running) {
      if ((runQuiet('docker', ['stop', c.id]).status ?? 1) !== 0) {
        console.error(`dc snapshot: couldn't stop container ${c.id}, so nothing was saved.`);
        ok = false;
        break;
      }
      stopped.push(c);
    }
    if (ok) mkdirSync(tmp, { mode: 0o700 });
    const snapMount = ok && mountArg('bind', tmp, '/snap');
    for (const v of ok ? volumes : []) {
      const r = helper(image, [mountArg('volume', v, '/v', true), snapMount], save('/v', `${toolOf(v)}.tgz`));
      if (r.status !== 0 || interrupted) { ok = false; if (!interrupted) console.error(`dc snapshot: couldn't save ${v}:\n${(r.stderr || '').trim()}`); break; }
    }
    if (ok) {
      const r = helper(image, [mountArg('bind', root, '/proj', true), snapMount], save('/proj', 'project.tgz'));
      if (r.status !== 0 || interrupted) { ok = false; if (!interrupted) console.error(`dc snapshot: couldn't save the project folder:\n${(r.stderr || '').trim()}`); }
    }
    if (ok) {
      writeJson(join(tmp, 'snapshot.json'), {
        name, root, created: new Date().toISOString(), image,
        volumes: Object.fromEntries(volumes.map((v) => [toolOf(v), v])),
      });
      // Replace an old snapshot only now that the new one is complete.
      if (replacing) {
        const old = `${dir}.old-${process.pid}`;
        renameSync(dir, old);
        renameSync(tmp, dir);
        rmSync(old, { recursive: true, force: true });
      } else {
        renameSync(tmp, dir);
      }
    }
  } finally {
    if (!ok) rmSync(tmp, { recursive: true, force: true });
    for (const c of stopped) runQuiet('docker', ['start', c.id]);
    process.removeListener('SIGINT', onInt);
  }
  if (stopped.length) await resumeForwards(root);
  if (interrupted) { console.error('dc snapshot: stopped; nothing was saved.'); return 130; }
  if (!ok) return 1;
  console.log(`${replacing ? 'Replaced' : 'Saved'} snapshot ${name}: the project folder${volumes.length ? ` and ${volumes.map(toolOf).join(', ')} data` : ''} (${humanSize(dirSize(dir))}).`);
  console.log(`\`dc restore ${name}\` puts it all back.`);
  return 0;
}

async function cmdRestore(root, flags, rest) {
  const name = rest[0];
  if (!name || rest.length > 1) { console.error('dc restore: give the snapshot\'s name, such as `dc restore clean` (`dc snapshot --list` shows them).'); return 1; }
  const dir = join(snapshotsDir(root), name);
  const meta = SNAPSHOT_NAME.test(name) && !PARTIAL.test(name) && readJson(join(dir, 'snapshot.json'));
  if (!meta) { console.error(`dc restore: no snapshot named ${name}. \`dc snapshot --list\` shows them.`); return 1; }
  if (normalizeLocalFolder(meta.root) !== normalizeLocalFolder(root)) {
    console.error(`dc restore: ${name} was taken of ${meta.root}, not this folder.`);
    return 1;
  }
  if (refuseOverlap(root, 'restore')) return 1;
  const tools = Object.keys(meta.volumes || {}).filter((t) => AGENT_TOOLS.includes(t));

  const q = `Restore ${name} (${new Date(meta.created).toLocaleString()})? This replaces everything in ${root}, including its git history,`
    + `${tools.length ? ' and this project\'s Claude, Codex, and Gemini data' : ''} with the snapshot.`;
  if (!(await confirm(q, flags))) return 1;

  const cs = findContainers(root);
  const image = helperImage(cs, meta.image);
  if (!image) return 1;
  const snapMount = mountArg('bind', dir, '/snap', true);
  const archives = [...tools.map((t) => `${t}.tgz`), 'project.tgz'];

  // Check every archive is whole, and that the project archive is this kind of
  // project, before changing anything.
  const check = helper(image, [snapMount],
    archives.map((a) => `tar -tzf /snap/${a} >/dev/null || { echo "damaged: ${a}" >&2; exit 1; }`).join('; ')
    + "; tar -tzf /snap/project.tgz | grep -q -E '^(\\./)?\\.devcontainer/devcontainer\\.json$' || { echo 'no .devcontainer/devcontainer.json in the project archive' >&2; exit 1; }");
  if (check.status !== 0) {
    console.error(`dc restore: snapshot ${name} can't be used, so nothing was changed:\n${(check.stderr || '').trim()}`);
    return 1;
  }

  // Fill the volumes the container actually uses (the dev container tool
  // named them), else the ones the snapshot came from, else this folder's.
  const mounted = mountedVolumes(cs);
  const id = devcontainerId(idLabelsFor(root));
  const target = (t) => mounted[t]
    || (AGENT_VOLUME.test(meta.volumes[t] || '') && toolOf(meta.volumes[t]) === t ? meta.volumes[t] : `agent-${t}-${id}`);

  const quick = flags.has('--quick');
  for (const c of cs) {
    if ((runQuiet('docker', quick ? ['stop', c.id] : ['rm', '-f', c.id]).status ?? 1) !== 0) {
      console.error(`dc restore: couldn't ${quick ? 'stop' : 'remove'} container ${c.id}, so nothing was changed.`);
      return 1;
    }
  }

  const retry = `Run \`dc restore ${name}\` from ${root} to try again; the snapshot is unchanged.`;
  for (const t of tools) {
    const vol = target(t);
    runQuiet('docker', ['volume', 'create', vol]);
    const r = helper(image, [mountArg('volume', vol, '/v'), snapMount], refill('/v', `${t}.tgz`, true));
    if (r.status !== 0) { console.error(`dc restore: couldn't restore ${vol}:\n${(r.stderr || '').trim()}\n${retry}`); return 1; }
  }
  // Docker Desktop's shared folders (macOS, Windows) refuse ownership changes.
  const r = helper(image, [mountArg('bind', root, '/proj'), snapMount], refill('/proj', 'project.tgz', platform() === 'linux'));
  let status = 0;
  if (r.status === 4) {
    const left = (r.stderr || '').split('\n').filter((l) => l.startsWith('left: ')).map((l) => l.slice(6));
    console.error(`dc restore: everything from the snapshot is back, but these couldn't be removed (a program may have them open): ${left.join(', ')}. `
      + 'Close that program and delete them, or run the restore again.');
    status = 1;
  } else if (r.status !== 0) {
    console.error(`dc restore: couldn't restore the project folder. If a file in it is open in another program, close it.\n${(r.stderr || '').trim()}\n${retry}`);
    return 1;
  } else {
    console.log(`Restored ${name}.`);
  }

  if (quick) {
    for (const c of cs) runQuiet('docker', ['start', c.id]);
    await resumeForwards(root);
    return status;
  }
  console.log('Starting a fresh container. As with any rebuild, you\'ll sign in to Claude again (`--quick` keeps the container, and the sign-in).');
  const up = dc(['up', '--workspace-folder', root]);
  if (up === 0) await resumeForwards(root);
  return up || status;
}

function requireRoot() {
  const root = findProjectRoot(process.cwd());
  if (!root) {
    console.error('dc: no .devcontainer/devcontainer.json found in this directory or any parent.');
    process.exit(1);
  }
  return root;
}

/** Every container the devcontainer CLI has labelled, regardless of project. */
function allDevcontainers() {
  const r = capture('docker', [
    'ps', '-a', '--filter', `label=${LABEL}`,
    '--format', `{{.ID}}\t{{.State}}\t{{.Label "${LABEL}"}}`,
  ]);
  if (r.status !== 0) return [];
  return (r.stdout || '')
    .split('\n').filter(Boolean)
    .map((line) => { const [id, state, folder] = line.split('\t'); return { id, state, folder }; });
}

/** Containers this project owns. */
function findContainers(root) {
  const want = normalizeLocalFolder(root);
  return allDevcontainers().filter((c) => normalizeLocalFolder(c.folder) === want);
}

/**
 * Explain a no-match. Distinguishes "you have no containers" from "your label
 * looks different than expected", which is the likely failure on Docker Desktop's
 * WSL2 backend where host paths can be rewritten.
 */
function reportNoMatch(root) {
  const all = allDevcontainers();
  console.log(`no container for ${root}`);
  if (!all.length) return;
  console.log(`\n  ${all.length} dev container(s) exist, but none match this path:`);
  for (const c of all) console.log(`    ${c.id}  ${c.state}  ${c.folder}`);
  console.log(`\n  looking for (normalized): ${normalizeLocalFolder(root)}`);
  console.log('  If one of the above is this project, the label format is unhandled --');
  console.log('  please report it.');
}

// ── install / uninstall ─────────────────────────────────────────────────────

// Windows gets BOTH shims. CMD cannot run a .ps1, and PowerShell going through
// a .cmd loses arguments: PS does not quote a bare `a&b`, so cmd.exe splits on
// the & and discards everything after it. Each shell needs its own entry point.
const installPaths = (names) => IS_WIN
  ? { payload: join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Programs', 'dc'),
      binDir:  join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Programs', 'dc'),
      shims: names.flatMap((n) => [`${n}.cmd`, `${n}.ps1`]) }
  : { payload: join(homedir(), '.local', 'share', 'dc'),
      binDir:  join(homedir(), '.local', 'bin'),
      shims: names };

// With no name, install (and uninstall) both `dc` and `dcp`. `dcp` is there for
// anyone whose `dc` is already taken, such as by the POSIX desk calculator.
function installNames(rest) {
  if (!rest[0]) return ['dc', 'dcp'];
  const name = rest[0].replace(/[^\w.-]/g, '');
  if (!name || /^\.+$/.test(name)) throw new Error(`"${rest[0]}" can't be a command name. Try letters, like dc install dcx.`);
  return [name];
}

/** Body for a generated shim, with the payload path baked in absolutely. */
export function shimBody(kind, target) {
  if (kind === 'cmd') return `@node "${target}" %*\r\n`;
  if (kind === 'ps1') return `node "${target}" @args\r\nexit $LASTEXITCODE\r\n`;
  return `#!/bin/sh\nexec node "${target}" "$@"\n`;
}

function cmdInstall(flags, rest) {
  const names = installNames(rest);
  const link = flags.has('--link');
  const { payload, binDir, shims } = installPaths(names);
  // Look before writing our own shim, which could otherwise be what `which` finds.
  const calculator = !IS_WIN && names.includes('dc') && !existsSync(join(binDir, 'dc')) && has('dc');
  mkdirSync(binDir, { recursive: true });

  // --link points the shim at the repo copy so edits take effect immediately.
  const target = link ? join(HERE, 'dc.mjs') : join(payload, 'dc.mjs');
  if (!link) { mkdirSync(payload, { recursive: true }); copyFileSync(join(HERE, 'dc.mjs'), target); }

  // Generated shims embed an ABSOLUTE path, so there is no symlink resolution to
  // get wrong (BSD/macOS readlink lacks -f on older releases).
  for (const shim of shims) {
    const shimPath = join(binDir, shim);
    const kind = shim.endsWith('.cmd') ? 'cmd' : shim.endsWith('.ps1') ? 'ps1' : 'sh';
    writeFileSync(shimPath, shimBody(kind, target));
    if (kind === 'sh') chmodSync(shimPath, 0o755);
    console.log(`installed: ${shimPath}${link ? '  (linked to repo)' : ''}`);
  }

  const onPath = (process.env.PATH || '').split(IS_WIN ? ';' : ':')
    .some((p) => normalizeLocalFolder(p) === normalizeLocalFolder(binDir));

  if (IS_WIN) {
    // Append to the *registry* User PATH, not the merged process PATH.
    const ps = has('pwsh') ? 'pwsh' : 'powershell';
    const script =
      `$d='${binDir}';` +
      `$u=[Environment]::GetEnvironmentVariable('Path','User');` +
      `if(($u -split ';') -notcontains $d){[Environment]::SetEnvironmentVariable('Path',($u.TrimEnd(';')+';'+$d),'User');Write-Output 'added'}`;
    const r = capture(ps, ['-NoProfile', '-Command', script]);
    if ((r.stdout || '').includes('added')) {
      console.log(`added to your user PATH: ${binDir}`);
      console.log('open a NEW terminal for it to take effect.');
    }
  } else if (!onPath) {
    console.log(`\nNOTE: ${binDir} is not on your PATH. Add to your shell profile:`);
    console.log(`  export PATH="${binDir}:$PATH"`);
  }
  // Only say so if ours is now the one that runs; otherwise nothing is hidden.
  const found = calculator && capture('which', ['dc']).stdout?.trim();
  if (found && normalizeLocalFolder(found) === normalizeLocalFolder(join(binDir, 'dc'))) {
    console.log('\nNOTE: your system already had a `dc` command (a desk calculator), and this one now hides it.');
    console.log('To get the calculator back, run `dcp uninstall dc` and use `dcp` instead.');
  }
  return 0;
}

function cmdUninstall(_flags, rest) {
  const { payload, binDir, shims } = installPaths(installNames(rest));

  let any = false;
  for (const shim of shims) {
    const shimPath = join(binDir, shim);
    if (existsSync(shimPath)) { rmSync(shimPath, { force: true }); console.log(`removed: ${shimPath}`); any = true; }
  }
  if (!any) console.log(`not installed: ${shims.map((f) => join(binDir, f)).join(', ')}`);

  // Only drop the shared payload once no remaining shim references it — removing
  // one name (dc uninstall dc) must not break the others.
  if (existsSync(payload)) {
    const target = join(payload, 'dc.mjs');
    const stillUsed = readdirSync(binDir).some((f) => {
      try { return readFileSync(join(binDir, f), 'utf8').includes(target); } catch { return false; }
    });
    if (stillUsed) console.log(`kept: ${payload} (still used by another install)`);
    else { rmSync(payload, { recursive: true, force: true }); console.log(`removed: ${payload}`); }
  }
  // If nothing of ours is left in the bin dir, remove the PATH entry install
  // added. Only ever the exact directory we created, so nothing else can break.
  // On Windows payload and binDir are the SAME folder, so by this point the
  // payload removal above has usually deleted it -- a missing dir means the
  // same thing as an empty one: the last install is gone.
  if (IS_WIN && (!existsSync(binDir) || readdirSync(binDir).length === 0)) {
    rmSync(binDir, { recursive: true, force: true });
    const ps = has('pwsh') ? 'pwsh' : 'powershell';
    const script =
      `$d='${binDir}';` +
      `$u=[Environment]::GetEnvironmentVariable('Path','User');` +
      `$n=(($u -split ';') | Where-Object { $_ -and $_ -ne $d }) -join ';';` +
      `if($n -ne $u){[Environment]::SetEnvironmentVariable('Path',$n,'User');Write-Output 'removed'}`;
    const r = capture(ps, ['-NoProfile', '-Command', script]);
    if ((r.stdout || '').includes('removed')) console.log('removed the PATH entry too.');
    else if (r.stderr) console.error(`warning: could not remove the PATH entry: ${r.stderr.trim().split('\n')[0]}`);
  }
  return 0;
}

function cmdDoctor() {
  const ok = (b) => (b ? 'ok  ' : 'FAIL');
  const nodeOk = Number(process.versions.node.split('.')[0]) >= 18;
  console.log(`${ok(nodeOk)} node ${process.versions.node}${nodeOk ? '' : '  (need >= 18)'}`);

  const dockerOk = has('docker') && capture('docker', ['info']).status === 0;
  console.log(`${ok(dockerOk)} docker ${dockerOk ? 'running' : 'not found or not running'}`);

  const [c] = devcontainerCmd();
  console.log(`${ok(true)} devcontainer cli via ${c === 'devcontainer' ? 'global install' : 'npx (slower; npm i -g @devcontainers/cli)'}`);

  // Not being in a project is not a broken setup, so do not shout FAIL at
  // someone running `dc doctor` from their home directory to check the install.
  const root = findProjectRoot(process.cwd());
  if (root) console.log(`${ok(true)} project ${root}`);
  else console.log(`--   project  none here; cd to a folder with .devcontainer/devcontainer.json`);
  if (root && dockerOk) {
    const cs = findContainers(root);
    console.log(`     containers: ${cs.length ? cs.map((x) => `${x.id} (${x.state})`).join(', ') : 'none'}`);
  }
  return dockerOk && nodeOk ? 0 : 1;
}

// ── commands ────────────────────────────────────────────────────────────────

const HELP = `dc — dev containers without VS Code

  dc up [--rebuild] [--no-cache]   create/start the container
  dc up --fresh [--yes]            rebuild with empty agent folders (deletes history)
  dc build                         build the image
  dc shell                         interactive shell inside it
  dc exec <cmd> [args...]          run a command inside it
  dc claude|codex|gemini|pw [...]  run an agent inside it
  dc down                          stop the container
  dc rm [--volumes] [--yes]        stop and remove it (--volumes: delete agent data too)
  dc volumes [--rm | --prune]      list or delete saved agent data (--yes: don't ask)
  dc forward [<port>...]           forward ports to localhost, or list them
  dc forward <port>... --network   ...and to other devices on your network
  dc forward --rm <port>...        stop forwarding them
  dc snapshot <name> [--overwrite] save the project folder and agent data
  dc snapshot --list | --rm <name> list snapshots, or delete one
  dc restore <name> [--quick]      put a snapshot back (--yes: don't ask)
  dc status                        show this project's containers
  dc logs [--follow]               container logs
  dc doctor                        check prerequisites
  dc install [name] [--link]       install to your PATH (as dc and dcp, or just [name])
  dc uninstall [name]              remove it (both names, or just [name])
`;

const FORWARDING = new Set(['exec', 'claude', 'codex', 'gemini', 'pw']);

async function main(argv) {
  const cmd = argv[0];
  // Forwarding commands keep their arguments verbatim; only dc's own commands
  // get flag parsing.
  const raw = argv.slice(1);
  const { flags, rest } = FORWARDING.has(cmd) ? { flags: new Set(), rest: raw } : parseArgs(raw);

  if (Number(process.versions.node.split('.')[0]) < 18) {
    console.error(`dc: Node 18+ required (found ${process.versions.node}).`);
    return 1;
  }
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h' || flags.has('--help')) { console.log(HELP); return 0; }
  if (cmd === 'version' || cmd === '--version' || flags.has('--version')) { console.log('dc 1.0.0'); return 0; }
  if (cmd === 'install') return cmdInstall(flags, rest);
  if (cmd === 'uninstall') return cmdUninstall(flags, rest);
  if (cmd === 'doctor') return cmdDoctor();
  if (cmd === 'volumes') {
    const unknown = [...flags].filter((f) => !['--rm', '--prune', '--yes'].includes(f));
    if (unknown.length) { console.error(`dc volumes: unknown option ${unknown.join(' ')}`); return 1; }
  }
  // The background relay `dc forward` starts; not a user command.
  if (cmd === '__relay') return relayMain(rest[0]);
  if (cmd === 'forward') {
    const unknown = [...flags].filter((f) => !['--rm', '--network'].includes(f));
    if (unknown.length) { console.error(`dc forward: unknown option ${unknown.join(' ')}`); return 1; }
    if (flags.has('--rm') && flags.has('--network')) {
      console.error('dc forward: --rm stops a forward; to keep it but make it localhost only, run `dc forward <port>` without --network.');
      return 1;
    }
  }
  if (cmd === 'snapshot' || cmd === 'restore') {
    const allowed = cmd === 'snapshot' ? ['--list', '--rm', '--yes', '--overwrite'] : ['--quick', '--yes'];
    const unknown = [...flags].filter((f) => !allowed.includes(f));
    if (unknown.length) { console.error(`dc ${cmd}: unknown option ${unknown.join(' ')}`); return 1; }
  }
  if (cmd === 'rm') {
    const unknown = [...flags].filter((f) => !['--volumes', '--yes'].includes(f));
    if (unknown.length) { console.error(`dc rm: unknown option ${unknown.join(' ')}`); return 1; }
  }
  if (cmd === 'volumes' && flags.has('--prune')) {
    if (flags.has('--rm')) { console.error('dc volumes: use --rm or --prune, not both.'); return 1; }
    // Works across projects, so it doesn't need to run inside one.
    return preflight() ? cmdPrune(flags) : 1;
  }

  const root = requireRoot();
  // Every remaining command talks to Docker one way or another.
  if (!preflight()) return 1;

  switch (cmd) {
    case 'up': {
      const a = ['up', '--workspace-folder', root];
      if (flags.has('--fresh')) {
        const cs = findContainers(root);
        const volumes = projectVolumes(root, cs);
        if (volumes.length) {
          const q = 'Start fresh? Claude, Codex, and Gemini will forget this project\'s sessions, memory, settings, and plugins.';
          if (!(await confirm(q, flags))) return 1;
        } else {
          console.log('Nothing saved yet; rebuilding.');
        }
        const status = removeContainersAndVolumes(cs, volumes);
        if (status !== 0) return status;
        if (volumes.length) console.log('Agent data cleared; rebuilding.');
      }
      if (flags.has('--rebuild') || flags.has('--fresh')) a.push('--remove-existing-container');
      if (flags.has('--no-cache')) a.push('--build-no-cache');
      const status = dc(a);
      if (status === 0) await resumeForwards(root);
      return status;
    }
    case 'build':
      return dc(['build', '--workspace-folder', root, ...(flags.has('--no-cache') ? ['--no-cache'] : [])]);
    case 'shell':
      return dc(buildExecArgs(root, ['bash', '-l'], { login: false, env: process.env }));
    case 'exec': {
      if (!raw.length) { console.error('dc exec: need a command'); return 1; }
      // Login shell here too: node/npm resolve via /etc/profile.d in this image,
      // so a non-login exec would not find them either.
      return dc(buildExecArgs(root, raw, { env: process.env }));
    }
    case 'claude': case 'codex': case 'gemini': case 'pw': {
      const tool = cmd === 'pw' ? 'playwright-cli' : cmd;
      return dc(buildExecArgs(root, [tool, ...raw], { env: process.env }));
    }
    case 'rm':
      if (flags.has('--volumes')) return cmdRmVolumes(root, flags);
    // fall through
    case 'down': {
      const cs = findContainers(root);
      if (!cs.length) { reportNoMatch(root); return 0; }
      const volumes = cmd === 'rm' ? projectVolumes(root, cs) : [];
      for (const c of cs) {
        runQuiet('docker', cmd === 'rm' ? ['rm', '-f', c.id] : ['stop', c.id]);
      }
      if (volumes.length) {
        console.log('agent data kept for the next `dc up`:');
        listVolumes(volumes);
        console.log('`dc volumes --rm` deletes it.');
      }
      const ports = readForwards(root);
      if (ports.length) console.log(`Forwarding of ${ports.join(', ')} stops with the container; \`dc up\` starts it again.`);
      return 0;
    }
    case 'volumes':
      return cmdVolumes(root, flags);
    case 'forward':
      return cmdForward(root, flags, rest);
    case 'snapshot':
      return cmdSnapshot(root, flags, rest);
    case 'restore':
      return cmdRestore(root, flags, rest);
    case 'status': {
      const cs = findContainers(root);
      if (!cs.length) { reportNoMatch(root); return 0; }
      for (const c of cs) console.log(`${c.id}  ${c.state}  ${c.folder}`);
      const ports = readForwards(root);
      if (ports.length) {
        const st = (runningContainer(root) && relayStatus(root)) || { network: readNetworkForwards(root), listening: [], errors: {} };
        console.log('forwards:');
        for (const port of ports) console.log(`  ${describeForward(port, st)}`);
      }
      return 0;
    }
    case 'logs': {
      const [c] = findContainers(root);
      if (!c) { reportNoMatch(root); return 1; }
      return run('docker', ['logs', ...(flags.has('--follow') ? ['-f'] : []), c.id]).status ?? 1;
    }
    default:
      console.error(`dc: unknown command '${cmd}'\n`);
      console.log(HELP);
      return 1;
  }
}

// Node loads modules by their real path, but argv keeps the path as typed, so
// compare real paths: a symlink anywhere above dc.mjs (macOS's /var -> /private/var)
// would otherwise make dc silently do nothing.
const realOrSelf = (p) => { try { return realpathSync(p); } catch { return p; } };
if (process.argv[1] && fileURLToPath(import.meta.url) === realOrSelf(resolve(process.argv[1]))) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => { console.error(`dc: ${err && err.message ? err.message : err}`); process.exit(1); },
  );
}
