// Checks that the latest companion plugins still have what gamegen relies on:
// the commands, flags and output it uses, and the files it copies. Free and
// offline: help text, --version, a dry run. No API keys.
//
// It runs when COMPANIONS_DIR holds a fresh clone of each companion (named
// after it), as the companions workflow does every day; otherwise it skips:
//
//   COMPANIONS_DIR=/tmp/companions node --test tests/companions.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = process.env.COMPANIONS_DIR;
const skip = !DIR && 'set COMPANIONS_DIR to check the latest companions';
const { companions } = JSON.parse(readFileSync(join(ROOT, 'skills/gamegen/companions.json'), 'utf8'));

// Run a companion's CLI with no keys, from an empty folder (no .env to find).
function run(file, args) {
  const cwd = mkdtempSync(join(tmpdir(), 'gamegen-companion-'));
  try {
    const r = spawnSync(process.execPath, [file, ...args], {
      cwd, encoding: 'utf8', timeout: 60000, env: { PATH: process.env.PATH, HOME: cwd },
    });
    return r.stdout + r.stderr;
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}
const older = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0);
  return false;
};
const has = (text, words, who) => { for (const w of words) assert.ok(text.includes(w), `${who} still has ${w}`); };

for (const [name, c] of Object.entries(companions)) {
  test(`${name}: installs as the marketplace expects, at gamegen's minimum or newer`, { skip }, () => {
    const root = join(DIR, name, c.path);
    const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8'));
    assert.equal(plugin.name, name);
    assert.match(plugin.version, /^\d{4}\.\d{1,2}\.\d{1,2}(\.\d+)?$/);
    if (c.minimum) assert.ok(!older(plugin.version, c.minimum), `${plugin.version} is at least ${c.minimum}`);
    assert.ok(existsSync(join(root, name, 'SKILL.md')), `${name} has its skill`);
  });
}

test('imagegen2: transparent backgrounds and reference pictures', { skip }, () => {
  has(run(join(DIR, 'imagegen2/skills/imagegen2/generate.cjs'), ['--help']), ['--background', '--image', '--output'], 'imagegen2');
});

test('nanogen: reference pictures and style presets', { skip }, () => {
  has(run(join(DIR, 'nanogen/skills/nanogen/generate.cjs'), ['--help']), ['--image', '--style', '--output'], 'nanogen');
});

test('audiogen: music, sound effects, voices and loops', { skip }, () => {
  has(run(join(DIR, 'audiogen/skills/audiogen/generate.cjs'), ['--help']), ['music', 'sfx', 'voice', '--loop'], 'audiogen');
});

test('meshgen: the commands, flags and output 3D games use', { skip }, () => {
  const cli = join(DIR, 'meshgen/skills/meshgen/meshgen.cjs');
  has(run(cli, ['--help']), ['model', 'character', 'balance', '--dir', '--image', '--height', '--actions',
    '--dry-run', '--max-credits'], 'meshgen');
  // A dry run says what it would cost, without a key or a call.
  const dry = JSON.parse(run(cli, ['character', 'hero', '--prompt', 'a knight', '--height', '1.8',
    '--actions', 'idle,walk', '--dir', 'out', '--dry-run']).trim().split('\n').pop());
  assert.equal(dry.success, true);
  assert.equal(typeof dry.credits, 'number');
  // Real runs report credits and warnings (not callable without a key).
  has(readFileSync(cli, 'utf8'), ['creditsUsed', 'creditsLeft', 'warnings'], 'meshgen');
  // The three.js copy 3D web games are built with.
  const vendor = join(DIR, 'meshgen/skills/meshgen/viewer/vendor');
  for (const f of ['three.module.js', 'three.core.js', 'LICENSE', 'addons/loaders/GLTFLoader.js', 'addons/utils/SkeletonUtils.js']) {
    assert.ok(existsSync(join(vendor, f)), `meshgen still ships ${f}`);
  }
});
