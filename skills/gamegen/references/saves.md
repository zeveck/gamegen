# Save slots (`--saves`)

Read this for `--saves`. It gives the game several saved games side by side,
with a Load screen, instead of the one save every game gets otherwise
(web-target.md's "Saving"). Several people can share a browser, and a player
can start over, or try another ending, without losing a game.

- `--saves` alone, or `--saves 3`: three slots. Any number from 2 to 20
  gives that many.
- `--saves many` (or `infinite`): no fixed number. Players make a new save
  for each new game and delete the ones they don't want.

**The flag decides it; never weigh whether the game needs slots.** Without
it, the game keeps its one save, as now. Write `Saves: 3` (or
`Saves: many`) in `design/STATUS.md`'s settings, so later runs keep it.

It's for web games and web exports. For an engine target, build the same
screens on the engine's own save files.

Given alone on a finished game, it's a small change: follow "Changing a
finished game" in change.md, with no design review. **Nobody loses their
progress:** a game that had one save moves it into slot 1 the first time it
loads. **How and when the game saves stays as it is:** an autosave still
autosaves, into the slot being played, and a game that saves only at save
points still does. Slots add more games, not more ways to save.

## The design

Add to "Win, lose and progress": the number of slots, and what each slot
shows so a player knows it at a glance: two to four of the character's name,
chapter or level, area, play time or last played, and a mark for a New Game+
or a finished game, if the game has them. Settings, controls and best scores
stay shared by every slot.

## Building it

Copy `${CLAUDE_SKILL_DIR}/templates/web/saves.js` into the game unchanged,
load it before the game's code, and set it up:

```js
const saves = gameSaves.setup({ key: 'pp3', slots: 3, version: 1,
  oldKey: 'pp3-save', fromOld: (old) => ({ data: old.progress, summary: { area: old.progress.area } }) });
```

`slots: Infinity` for `many`. `oldKey` is the key of the game's one save,
when it had one: it moves into slot 1, once, and the old key is removed. If
that save also held settings, copy them into the game's own settings key
before calling `setup`, and have `fromOld` return just the progress. Slot
ids are numbers. `saves.save(id, data, summary)` saves (the
summary is what the slot shows), `saves.load(id)` loads, `saves.list()` is
the Load screen's rows, `saves.create()` gives a slot for a new game,
`saves.remove(id)` deletes, and `saves.last()` is the slot Continue picks.
Bump `version` when the save's shape changes, and read older ones too.

- **The title screen:** Continue (the slot played last; only when there is
  one), Load, and New Game.
- **New Game** uses an empty slot. When every slot is taken, it asks which
  one to replace, and says what's in it ("Replace Mira, Chapter 3?").
- **The Load screen,** in the game's own style: every slot with its summary
  (empty ones say "Empty"), and Delete, which asks first. With `many`, the
  newest save first, and it scrolls.
- **A slot that can't be read** says so ("This save can't be read"), with
  Delete. It never stops the game or the Load screen.
- **If the browser won't save** (`save` returns false: storage full), say so
  and keep playing; with `many`, suggest deleting an old save.
- Usable by mouse, touch, keyboard and, with `--gamepad`, controller, and
  it fits every targeted size.

## Play-testing it

1. Start a game in two slots, play each a little, and reload: each loads
   its own progress, the summaries match, and Continue picks the one played
   last.
2. With every slot full (or with `many`, several saves), New Game asks
   before replacing one, and Delete asks before deleting.
3. Put an unreadable slot in `localStorage` (a key `<key>-slot-2` holding
   `{`): the Load screen shows it as unreadable, with Delete, and no errors.
4. For a game that had one save: put an old save under its old key, reload,
   and it's in slot 1, with its settings unchanged.
5. With a controller: the same menus with `__pad` (gamepad.md).
