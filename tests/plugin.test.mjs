// Checks that the plugin, its manifests, its docs and its reference files
// agree with each other. Run with `node --test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

const plugin = json('skills/.claude-plugin/plugin.json');
const market = json('.claude-plugin/marketplace.json');
const skill = read('skills/gamegen/SKILL.md');
const readme = read('README.md');
const REFS = 'skills/gamegen/references';

const COMPANIONS = ['imagegen2', 'anim8gen', 'audiogen', 'nanogen'];
// The options, as SKILL.md's flag table defines them.
const FLAGS = [...skill.matchAll(/^\| `(--[a-z-]+)` \|/gm)].map((m) => m[1]);
// Where each companion plugin lives, as the marketplace must point at it.
const SOURCES = {
  imagegen2: { url: 'https://github.com/zeveck/imagegen2.git', path: 'skills' },
  anim8gen: { url: 'https://github.com/zeveck/anim8gen.git', path: '.codex/skills' },
  audiogen: { url: 'https://github.com/zeveck/audiogen.git', path: 'skills' },
  nanogen: { url: 'https://github.com/zeveck/nanogen.git', path: 'skills' },
};

test('version is date-based CalVer and matches the first CHANGELOG heading', () => {
  assert.match(plugin.version, /^\d{4}\.\d{1,2}\.\d{1,2}$/);
  const first = read('CHANGELOG.md').match(/^## v(\S+)/m);
  assert.ok(first, 'CHANGELOG.md has a "## v" heading');
  assert.equal(first[1], plugin.version);
});

test('marketplace and plugin manifests point at the skill', () => {
  // The plugin's name is the prefix its skill shows under: /gg:gamegen.
  assert.equal(plugin.name, 'gg');
  assert.equal(market.name, 'gamegen');
  assert.equal(market.plugins[0].name, 'gg');
  assert.equal(market.plugins[0].source, './skills');
  assert.equal(plugin.skills, './gamegen');
  assert.ok(existsSync(join(ROOT, 'skills/gamegen/SKILL.md')));
  // The plugin is rooted at skills/, so a root manifest would be a second plugin.
  assert.ok(!existsSync(join(ROOT, '.claude-plugin/plugin.json')));
});

test('depends on the four companion plugins, from this marketplace', () => {
  // Plain names resolve in this marketplace, which lists all four, so one
  // install command gets everything.
  assert.deepEqual([...plugin.dependencies].sort(), [...COMPANIONS].sort());
});

test('the marketplace lists each companion plugin from its own repository', () => {
  for (const name of COMPANIONS) {
    const entry = market.plugins.find((p) => p.name === name);
    assert.ok(entry, `${name} is listed`);
    assert.deepEqual(entry.source, { source: 'git-subdir', ...SOURCES[name] }, name);
  }
  assert.equal(market.plugins.length, 1 + COMPANIONS.length);
});

test('anim8gen gets imagegen2 from this marketplace', () => {
  // anim8gen's plugin.json declares no dependency; each marketplace entry says
  // where its imagegen2 comes from. Here it's this marketplace's copy.
  assert.deepEqual(market.plugins.find((p) => p.name === 'anim8gen').dependencies, ['imagegen2']);
  // Everything is in one marketplace, so nothing needs a cross-marketplace allowance.
  assert.equal(market.allowCrossMarketplaceDependenciesOn, undefined);
});

test('the README installs everything with one line', () => {
  assert.match(readme, /\/plugin install gg --marketplace zeveck\/gamegen/);
  assert.doesNotMatch(readme, /\/plugin marketplace add/);
});

test('the README\'s Contents lists every section, and every link lands on one', () => {
  const anchor = (t) => t.trim().toLowerCase().replace(/[^\w\- ]/g, '').replace(/\s/g, '-');
  const headings = [...readme.matchAll(/^(#{2,3}) (.+)$/gm)].map((m) => m[2]).filter((t) => t !== 'Contents');
  const toc = readme.split('## Contents')[1].split('\n## ')[0];
  const listed = [...toc.matchAll(/\[(.+?)\]\(#([^)]+)\)/g)];
  assert.deepEqual(listed.map((m) => m[1]), headings, 'Contents matches the headings, in order');
  for (const [, title, link] of listed) assert.equal(link, anchor(title), `${title} links to #${anchor(title)}`);
  // And every in-page link elsewhere in the README points at a real section.
  const anchors = new Set(headings.map(anchor));
  for (const [, link] of readme.matchAll(/\]\(#([^)]+)\)/g)) assert.ok(anchors.has(link), `#${link} exists`);
});

test('SKILL.md has the frontmatter Claude Code needs', () => {
  const fm = skill.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(fm, 'frontmatter block');
  assert.match(fm[1], /^name: gamegen$/m);
  assert.match(fm[1], /^description: /m);
  assert.match(fm[1], /^argument-hint: /m);
});

test('every flag is documented in the skill, its argument hint and the README', () => {
  const hint = skill.match(/^argument-hint: (.*)$/m)[1];
  for (const flag of FLAGS) {
    assert.ok(hint.includes(flag), `argument-hint lists ${flag}`);
    assert.ok(skill.includes(`| \`${flag}\``), `SKILL.md flag table has ${flag}`);
    assert.ok(readme.includes(`\`${flag}`), `README documents ${flag}`);
  }
  // And nothing documents a flag the skill doesn't know.
  const documented = new Set([...readme.matchAll(/`(--[a-z-]+)/g)].map((m) => m[1]));
  for (const flag of documented) {
    if (['--marketplace', '--network'].includes(flag)) continue; // plugin install, dc forward
    assert.ok(FLAGS.includes(flag), `README mentions unknown flag ${flag}`);
  }
});

test('help covers every option', () => {
  const help = read(`${REFS}/help.md`);
  for (const flag of FLAGS) {
    assert.match(help, new RegExp(`^## ${flag}$`, 'm'), `help has a section for ${flag}`);
    assert.ok(help.includes(`| \`${flag}`), `help's overview table lists ${flag}`);
  }
});

test('SKILL.md\'s flag table has the options everything else documents', () => {
  assert.ok(FLAGS.length >= 10, `found ${FLAGS.length} flags`);
  for (const flag of ['--platform', '--style', '--change', '--plan-only']) assert.ok(FLAGS.includes(flag), flag);
});

// The setup check, run against a stand-in curl (no network): it answers with
// STUB_CODE and writes STUB_BODY as the response body.
const SCRIPT = join(ROOT, 'skills/gamegen/scripts/check-setup.sh');
function runCheck(dir, { code = '401', body = '{}' } = {}) {
  const bin = join(dir, '.stub-bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, 'curl'), `#!/bin/sh
out=""
while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift ;; esac; shift; done
cat > /dev/null
[ -n "$out" ] && printf '%s' "$STUB_BODY" > "$out"
printf '%s' "$STUB_CODE"
`);
  chmodSync(join(bin, 'curl'), 0o755);
  return spawnSync('bash', [SCRIPT], {
    cwd: dir, encoding: 'utf8',
    env: { PATH: `${bin}:/usr/bin:/bin`, HOME: dir, STUB_CODE: code, STUB_BODY: body },
  });
}
const scratch = () => mkdtempSync(join(tmpdir(), 'gamegen-check-'));
const BOGUS = { OPENAI_API_KEY: 'sk-test-SECRET-openai', GEMINI_API_KEY: 'SECRET-gemini', ELEVENLABS_API_KEY: 'SECRET-eleven' };
const writeEnv = (dir) => writeFileSync(join(dir, '.env'),
  Object.entries(BOGUS).map(([k, v]) => `${k}="${v}"`).join('\n') + '\n');

test('setup check: missing keys stop the run', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = runCheck(dir);
  assert.equal(r.status, 1);
  assert.equal((r.stdout.match(/: missing [A-Z_]+_API_KEY/g) || []).length, 3, r.stdout);
});

test('setup check: refused keys stop the run, and no key is ever printed', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeEnv(dir);
  const r = runCheck(dir, { code: '401', body: '{"error":"Incorrect API key provided: sk-test-SECRET-openai"}' });
  assert.equal(r.status, 1);
  assert.equal((r.stdout.match(/failed \(the key was refused/g) || []).length, 3, r.stdout);
  for (const v of Object.values(BOGUS)) assert.ok(!(r.stdout + r.stderr).includes(v), `printed ${v}`);
});

test('setup check: a restricted key that works is not a reason to stop', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeEnv(dir);
  const r = runCheck(dir, { code: '403', body: '{"error":{"message":"You have insufficient permissions for this operation. Missing scopes: api.model.read"}}' });
  assert.match(r.stdout, /openai \(imagegen2, anim8gen\): ok \(a restricted key/);
});

test('setup check: finds the .env in a folder above', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeEnv(dir);
  const deep = join(dir, 'games', 'frog');
  mkdirSync(deep, { recursive: true });
  const r = runCheck(deep, { code: '200', body: '{"tier":"free","character_count":100,"character_limit":10000}' });
  assert.match(r.stdout, new RegExp(`env file: ${dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\.env`));
  assert.match(r.stdout, /openai \(imagegen2, anim8gen\): ok\n/);
  assert.match(r.stdout, /elevenlabs \(audiogen\): ok \(tier: free, 9,900 of 10,000 credits left\)/);
});

// prepare-env.sh, run in a scratch folder.
const PREPARE = join(ROOT, 'skills/gamegen/scripts/prepare-env.sh');
// HOME is a separate empty folder unless a test says otherwise.
function prepare(cwd, home) {
  const tmpHome = home ? null : scratch();
  try {
    return spawnSync('bash', [PREPARE], { cwd, encoding: 'utf8', env: { PATH: '/usr/bin:/bin', HOME: home || tmpHome } });
  } finally {
    if (tmpHome) rmSync(tmpHome, { recursive: true, force: true });
  }
}

test('prepare-env: makes a .env from the template and keeps it out of git', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = prepare(dir);
  assert.equal(r.status, 0, r.stderr);
  const env = readFileSync(join(dir, '.env'), 'utf8');
  for (const key of ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ELEVENLABS_API_KEY']) assert.match(env, new RegExp(`^${key}=$`, 'm'), key);
  assert.match(readFileSync(join(dir, '.gitignore'), 'utf8'), /^\.env$/m);
  // Running it again changes nothing.
  prepare(dir);
  assert.equal(readFileSync(join(dir, '.env'), 'utf8'), env);
  assert.equal((readFileSync(join(dir, '.gitignore'), 'utf8').match(/^\.env$/gm) || []).length, 1);
  // And the setup check then reports the empty placeholders as missing.
  assert.equal((runCheck(dir).stdout.match(/: missing [A-Z_]+_API_KEY/g) || []).length, 3);
});

test('prepare-env: adds only the missing keys to an existing .env, keeping the rest', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, '.env'), 'OPENAI_API_KEY=sk-keep-this\nOTHER=1');
  writeFileSync(join(dir, '.gitignore'), 'node_modules');
  const sub = join(dir, 'games'); mkdirSync(sub);
  const r = prepare(sub);
  assert.equal(r.status, 0, r.stderr);
  const env = readFileSync(join(dir, '.env'), 'utf8');
  assert.ok(env.startsWith('OPENAI_API_KEY=sk-keep-this\nOTHER=1\n'), env);
  assert.match(env, /^GEMINI_API_KEY=$/m);
  assert.match(env, /^ELEVENLABS_API_KEY=$/m);
  assert.equal((env.match(/OPENAI_API_KEY/g) || []).length, 1);
  assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), 'node_modules\n.env\n');
  assert.ok(!r.stdout.includes('sk-keep-this'), 'never prints a key');
  assert.ok(!existsSync(join(sub, '.env')), 'no second .env');
});

test('prepare-env: leaves a .env above the git repository alone', (t) => {
  const top = scratch(); t.after(() => rmSync(top, { recursive: true, force: true }));
  writeFileSync(join(top, '.env'), 'OPENAI_API_KEY=x\n');
  const proj = join(top, 'proj'); mkdirSync(proj);
  spawnSync('git', ['init', '-q', proj]);
  const r = prepare(proj);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(top, '.env'), 'utf8'), 'OPENAI_API_KEY=x\n');
  assert.ok(!existsSync(join(top, '.gitignore')), 'no .gitignore above the repository');
  assert.match(r.stdout, /outside this project/);
});

test('prepare-env: leaves ~/.env alone', (t) => {
  const home = scratch(); t.after(() => rmSync(home, { recursive: true, force: true }));
  writeFileSync(join(home, '.env'), 'OPENAI_API_KEY=x\n');
  const games = join(home, 'games'); mkdirSync(games);
  const r = prepare(games, home);
  assert.equal(readFileSync(join(home, '.env'), 'utf8'), 'OPENAI_API_KEY=x\n');
  assert.ok(!existsSync(join(home, '.gitignore')), 'no .gitignore in the home folder');
  assert.match(r.stdout, /outside this project/);
});

test('every reference file the skill names exists, and none is orphaned', () => {
  const files = readdirSync(join(ROOT, REFS)).filter((f) => f.endsWith('.md'));
  const all = [skill, ...files.map((f) => read(`${REFS}/${f}`))].join('\n');
  for (const [, name] of skill.matchAll(/references\/([a-z-]+\.md)/g)) {
    assert.ok(files.includes(name), `${name} exists`);
  }
  for (const f of files) assert.ok(all.includes(f), `${f} is referenced`);
});

test('the service worker template and the Pages workflow agree on placeholders', () => {
  const web = read(`${REFS}/web-target.md`);
  for (const placeholder of ["'__BUILD__'", '/*__FILES__*/']) {
    assert.ok(web.includes(`= ${placeholder}`) || web.includes(`[${placeholder}]`), `sw.js template has ${placeholder}`);
  }
  assert.match(web, /s\|'__BUILD__'\|/, 'workflow stamps the version');
  assert.match(web, /s\|\/\\\*__FILES__\\\*\/\|/, 'workflow fills the file list');
});

test('the plugin folder carries the license', () => {
  assert.equal(read('skills/LICENSE'), read('LICENSE'));
});

// publish.sh, run against a stand-in gh (no network). It logs every call and
// answers the few the script makes, as an account with one repo, "taken".
const PUBLISH = join(ROOT, 'skills/gamegen/scripts/publish.sh');
function publish(dir, args, { signedIn = true, cert = 'approved', env = {} } = {}) {
  const bin = join(dir, '.stub-bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, 'gh'), `#!/bin/sh
echo "$*" >> "$GH_LOG"
case "$*" in
  "api user --jq .login") [ "$SIGNED_IN" = 1 ] && echo zeveck || exit 1 ;;
  "repo view me/taken --json"*) echo "public | A frog game | 2026-04-25" ;;
  "repo view me/offline"*) echo "error connecting to api.github.com" >&2; exit 1 ;;
  "repo view"*) echo "GraphQL: Could not resolve to a Repository with the name 'x'." >&2; exit 1 ;;
  *"--jq .html_url") echo "https://frog.example.com/" ;;
  *"https_certificate"*) echo "$CERT" ;;
esac
`);
  chmodSync(join(bin, 'gh'), 0o755);
  const log = join(dir, 'gh.log');
  const r = spawnSync('bash', [PUBLISH, ...args], {
    cwd: dir, encoding: 'utf8',
    env: { PATH: `${bin}:/usr/bin:/bin`, HOME: dir, GH_LOG: log, SIGNED_IN: signedIn ? '1' : '0',
      CERT: cert, PUBLISH_WAIT: '0', PUBLISH_POLL: '0', ...env },
  });
  return { ...r, calls: existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : [] };
}

test('publish: not signed in to GitHub says how, and changes nothing', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = publish(dir, ['check'], { signedIn: false });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /not signed in \(run 'gh auth login'/);
});

test('publish: a taken repo name says what is there and offers the next free one', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.equal(publish(dir, ['repo', 'me/free']).stdout, 'free: me/free\n');
  assert.equal(publish(dir, ['repo', 'me/taken']).stdout,
    'taken: me/taken (public | A frog game | 2026-04-25)\nfree: me/taken-2\n');
  // A failed lookup is never taken for a free name.
  const offline = publish(dir, ['repo', 'me/offline']);
  assert.equal(offline.status, 1);
  assert.match(offline.stdout, /couldn't check/);
});

test('publish: turns on Pages at the custom address, then requires HTTPS', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = publish(dir, ['pages', 'me/frog', 'frog.example.com']);
  assert.equal(r.stdout, 'url: https://frog.example.com/\n');
  assert.deepEqual(r.calls, [
    'api -X POST repos/me/frog/pages -f build_type=workflow',
    'api -X PUT repos/me/frog/pages -f cname=frog.example.com',
    'repo edit me/frog --homepage https://frog.example.com',
  ]);
  assert.equal(publish(dir, ['https', 'me/frog']).stdout, 'https: on\n');
  const waiting = publish(dir, ['https', 'me/frog'], { cert: 'authorization_pending' });
  assert.equal(waiting.status, 2);
  assert.match(waiting.stdout, /still waiting/);
});

test('publish: settings come from the environment or the .env, and never the keys', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, '.env'), 'OPENAI_API_KEY=sk-SECRET\nGAMEGEN_DOMAIN="example.com"  # mine\n# GAMEGEN_GALLERY=me/old-games\n');
  const deep = join(dir, 'frog'); mkdirSync(deep);
  const r = publish(deep, ['settings'], { env: { GAMEGEN_MAKING_OF: 'on' } });
  assert.equal(r.stdout, 'GAMEGEN_DOMAIN: example.com\nGAMEGEN_GALLERY: not set\nGAMEGEN_MAKING_OF: on\n');
});

test('publish: a new gallery is served straight from its main branch', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const r = publish(dir, ['gallery-pages', 'me/games']);
  assert.equal(r.stdout, 'url: https://frog.example.com/\n');
  assert.equal(r.calls[0], 'api -X POST repos/me/games/pages -f source[branch]=main -f source[path]=/');
});

test('the gallery template has the placeholders publish.md fills in', () => {
  const page = read('skills/gamegen/templates/gallery.html');
  const steps = read(`${REFS}/publish.md`);
  for (const p of ['GALLERY_TITLE', 'GAME_URL', 'GAME_IMAGE', 'GAME_TITLE', 'GAME_DESCRIPTION']) {
    assert.ok(page.includes(p), `template has ${p}`);
    assert.ok(steps.includes(`\`${p}\``), `publish.md says how to fill in ${p}`);
  }
});
