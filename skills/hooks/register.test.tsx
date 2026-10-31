import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const BAND = {
  plugin: 'gg',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 80, scroll: { offset: 0, bodyRows: 3 }, view: {} },
} as const

// A pretend disk: file path -> text, folder path -> its subfolders, and when
// each game's STATUS.md last changed.
function disk(on: On, files: Record<string, string>, dirs: Record<string, string[]>, changed: Record<string, number> = {}) {
  on('session.cwd', () => ({ value: '/proj' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('fs.read', (_, e) => {
    const text = files[e.path]
    if (text === undefined) throw new Error(`no such file: ${e.path}`)
    return { value: text }
  })
  on('fs.list', (_, e) => ({
    value: (dirs[e.path ?? '/proj'] ?? []).map(name => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false })),
  }))
  on('fs.stat', (_, e) => {
    const mtimeMs = changed[e.path]
    if (mtimeMs === undefined) throw new Error(`no such file: ${e.path}`)
    return { value: { kind: 'file', size: 1, mtimeMs, isLink: false } }
  })
  // Stands for the engine's own band: drawn when the mod has nothing to show.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
}

async function band($: Engine) {
  await $.session.start({ cwd: '/proj', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const text = (await ui.find({ type: 'Text' }))?.text
  await ui.unmount()
  return text
}

test('shows the game in this folder, by its STATUS.md heading', async ($, on) => {
  disk(on, { '/proj/design/STATUS.md': '# BarbarAIn\n\n## Requests\n' }, {})
  expect(await band($)).toBe('🎮 BarbarAIn')
})

test('otherwise the most recently changed game below, by name or folder', async ($, on) => {
  disk(
    on,
    { '/proj/frog/design/STATUS.md': 'no heading yet', '/proj/old/design/STATUS.md': '# Old Game' },
    { '/proj': ['old', 'frog', 'notes'] },
    { '/proj/old/design/STATUS.md': 100, '/proj/frog/design/STATUS.md': 200 },
  )
  expect(await band($)).toBe('🎮 frog')
})

test('an older STATUS.md heading loses its "Status:" label', async ($, on) => {
  disk(on, { '/proj/design/STATUS.md': '# Status: Tap Tester\n' }, {})
  expect(await band($)).toBe('🎮 Tap Tester')
})

test('no game, nothing of ours: the engine draws its own', async ($, on) => {
  disk(on, {}, { '/proj': ['notes'] })
  expect(await band($)).toBe('engine')
})
