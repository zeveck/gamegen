// Checks that the plugin, its manifests, its docs and its reference files
// agree with each other. Run with `node --test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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
const FLAGS = ['--platform', '--style', '--target', '--scope', '--budget', '--rounds', '--plan-only', '--continue', '--out'];

test('version is date-based CalVer and matches the first CHANGELOG heading', () => {
  assert.match(plugin.version, /^\d{4}\.\d{1,2}\.\d{1,2}$/);
  const first = read('CHANGELOG.md').match(/^## v(\S+)/m);
  assert.ok(first, 'CHANGELOG.md has a "## v" heading');
  assert.equal(first[1], plugin.version);
});

test('marketplace and plugin manifests point at the skill', () => {
  assert.equal(plugin.name, 'gamegen');
  assert.equal(market.name, 'gamegen');
  assert.deepEqual(market.plugins.map((p) => [p.name, p.source]), [['gamegen', './skills']]);
  assert.equal(plugin.skills, './gamegen');
  assert.ok(existsSync(join(ROOT, 'skills/gamegen/SKILL.md')));
  // The plugin is rooted at skills/, so a root manifest would be a second plugin.
  assert.ok(!existsSync(join(ROOT, '.claude-plugin/plugin.json')));
});

test('depends on the four companion plugins, each from its own marketplace', () => {
  assert.deepEqual(
    plugin.dependencies.map((d) => `${d.name}@${d.marketplace}`).sort(),
    COMPANIONS.map((c) => `${c}@${c}`).sort(),
  );
});

test('the marketplace allows exactly the dependencies\' marketplaces', () => {
  // Without this allowlist, Claude Code installs gamegen but not its
  // dependencies, and gamegen then fails to load.
  assert.deepEqual(
    [...market.allowCrossMarketplaceDependenciesOn].sort(),
    [...new Set(plugin.dependencies.map((d) => d.marketplace))].sort(),
  );
});

test('the README install steps add every dependency\'s marketplace, then gamegen', () => {
  // A dependency only installs if its marketplace has been added.
  for (const d of plugin.dependencies) {
    assert.match(readme, new RegExp(`/plugin marketplace add zeveck/${d.marketplace}\\b`), d.marketplace);
  }
  assert.match(readme, /\/plugin install gamegen --marketplace zeveck\/gamegen/);
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
