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
  assert.match(plugin.version, /^\d{4}\.\d{1,2}\.\d{1,2}(\.\d+)?$/);
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

test('every script is used by the skill, a reference file or another script', () => {
  const dir = 'skills/gamegen/scripts';
  const scripts = readdirSync(join(ROOT, dir));
  const refs = readdirSync(join(ROOT, REFS)).map((f) => read(`${REFS}/${f}`));
  for (const f of scripts) {
    const others = scripts.filter((o) => o !== f).map((o) => read(`${dir}/${o}`));
    assert.ok([skill, ...refs, ...others].some((text) => text.includes(f)), `${f} is used`);
  }
  // The first-load check runs without a permission prompt, like the others.
  assert.match(skill.match(/^allowed-tools: (.*)$/m)[1], /scripts\/first-load\.sh \*/);
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
  "api user --jq .name // .login") [ "$SIGNED_IN" = 1 ] && echo "Rich Conlan" || exit 1 ;;
  "repo view me/taken --json"*) printf 'me/taken\tpublic | A frog game | 2026-04-25\n' ;;
  "repo view me/renamed --json"*) printf 'me/renamed-old\tprivate | An old game | 2026-04-25\n' ;;
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
  // A name left behind by a rename only redirects, so it's free.
  assert.equal(publish(dir, ['repo', 'me/renamed']).stdout,
    'free: me/renamed (it redirects to me/renamed-old, which using it ends)\n');
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
  assert.equal(r.stdout, 'GAMEGEN_DOMAIN: example.com\nGAMEGEN_GALLERY: not set\nGAMEGEN_MAKING_OF: on\nGAMEGEN_CREDIT: not set\n');
});

test('publish: the credit comes from the .env, then GitHub, then git, and is never made up', (t) => {
  const dir = scratch(); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const deep = join(dir, 'frog'); mkdirSync(deep);
  // Nothing known: no name at all, rather than a stand-in like "the player".
  assert.equal(publish(deep, ['credit'], { signedIn: false }).stdout, 'credit: not known\n');
  // git's user.name (HOME is the game folder here, so this is its only git config).
  writeFileSync(join(deep, '.gitconfig'), '[user]\n\tname = R. Conlan\n');
  assert.equal(publish(deep, ['credit'], { signedIn: false }).stdout, 'credit: R. Conlan\nfrom: git\n');
  // The GitHub profile name beats git's.
  assert.equal(publish(deep, ['credit']).stdout, 'credit: Rich Conlan\nfrom: github\n');
  // And GAMEGEN_CREDIT beats both.
  writeFileSync(join(dir, '.env'), 'OPENAI_API_KEY=sk-SECRET\nGAMEGEN_CREDIT="Rich & friends"  # us\n');
  const r = publish(deep, ['credit']);
  assert.equal(r.stdout, 'credit: Rich & friends\nfrom: GAMEGEN_CREDIT\n');
  assert.ok(!r.stdout.includes('SECRET'));
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

// The text scanner, in a real browser when playwright-cli is here (it isn't
// in CI). The test page has each problem once, beside text that's fine.
const hasPlaywright = spawnSync('sh', ['-c', 'command -v playwright-cli']).status === 0;
test('scan-text finds junk, lone words and cut-off text, and nothing else', { skip: !hasPlaywright && 'no playwright-cli' }, async (t) => {
  const { createServer } = await import('node:http');
  const { execFile } = await import('node:child_process');
  const page = read('tests/fixtures/scan-text.html');
  const server = createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end(page); });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const dir = scratch();
  mkdirSync(join(dir, '.playwright'));
  writeFileSync(join(dir, '.playwright/cli.config.json'), JSON.stringify({
    browser: { browserName: 'chromium', launchOptions: { headless: true, args: ['--no-sandbox'] } },
    outputDir: '.playwright/output',
  }));
  const cli = (...args) => new Promise((ok, fail) => execFile('playwright-cli', ['-s=scan', ...args], { cwd: dir },
    (err, stdout) => (err ? fail(err) : ok(stdout))));
  t.after(async () => { await cli('close').catch(() => {}); server.close(); rmSync(dir, { recursive: true, force: true }); });
  await cli('open', `http://127.0.0.1:${server.address().port}/`);
  await cli('resize', '1280', '720');
  const out = await cli('run-code', `async page => {
    await page.addScriptTag({ path: ${JSON.stringify(join(ROOT, 'skills/gamegen/scripts/scan-text.js'))} });
    return JSON.stringify(await page.evaluate(() => window.__scanText()));
  }`);
  const found = JSON.parse(JSON.parse(out.split('\n')[1]));
  assert.deepEqual(found.map((f) => `${f.kind} ${f.where}${f.by ? ' by ' + f.by : ''}`).sort(), [
    'clipped div.label by its own box',          // a label spilling out of its box
    'clipped div.off by the screen edge',        // off the side of the screen
    'clipped div.room by its own box',           // "The S…"
    'clipped h1.logo by its own box',            // a logo in a box that scrolls
    'clipped span.chip by div.box',              // cut off by a box around it
    'junk div#credits',                          // [object HTMLElement]
    'orphan p#t1.tag',                           // "seems." alone on its line
  ]);
});
