// Shows the name of the game being worked on above the prompt, found the way
// /gamegen finds a game: this folder's design/STATUS.md, or else the most
// recently changed game folder right below it. The name is that file's first
// heading (gamegen writes `# <Game name>`), or the folder's name.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { GameName } from '../types'

const game = atom({ plugin: 'gg', key: 'game' } as const, null as GameName | null)

const STATUS = 'design/STATUS.md'

async function nameIn($: EngineInterface, dir: string): Promise<GameName | null> {
  let text: string
  try {
    text = String(await $.fs.read(`${dir}/${STATUS}`))
  } catch {
    return null
  }
  const heading = /^#[ \t]+(.+?)[ \t]*$/m.exec(text)?.[1]?.replace(/^Status:[ \t]*/i, '')
  return heading || dir.split(/[\\/]/).filter(Boolean).pop() || null
}

async function findGame($: EngineInterface, root: string): Promise<GameName | null> {
  const here = await nameIn($, root)
  if (here) return here

  // Look at up to 200 folders at once, so a big folder stays quick.
  const folders = (await $.fs.list(root).catch(() => []))
    .filter(entry => entry.kind === 'dir' && !entry.name.startsWith('.') && entry.name !== 'node_modules')
    .slice(0, 200)
  const changed = await Promise.all(folders.map(async ({ name }) => {
    try {
      return { name, at: (await $.fs.stat(`${root}/${name}/${STATUS}`)).mtimeMs }
    } catch {
      return null // not a game folder
    }
  }))
  const newest = changed.reduce<{ name: string; at: number } | null>(
    (best, next) => (next && (!best || next.at > best.at) ? next : best), null)
  return newest ? nameIn($, `${root}/${newest.name}`) : null
}

// Look again whenever gamegen may have started, renamed or switched games.
async function refresh($: EngineInterface) {
  try {
    const found = await findGame($, await $.session.cwd()).catch(() => null)
    if (found !== (await read($, game))) await update($, game, () => found)
  } catch {
    // never let the name line get in the way of a turn
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($)
    return result
  })

  on('turn.complete', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const name = await read($, game)
    if (!name || e.props.hasSurvey) return next(e)

    const { Text } = $.ui.resolve(e)
    return <Text dimColor>🎮 {name}</Text>
  })
}
