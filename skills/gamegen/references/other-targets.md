# Other targets: engines and languages

When `--target` names something other than `web` (Godot, Unity, Unreal,
Pygame, LÖVE, a specific language), gamegen still designs the game, reviews
the design, and makes all the art and audio the same way. What changes is the
build and how much of it can be play-tested here.

## Before building

Check what's installed, and say in the design what can be tested:

- **Godot:** `godot --version` (or `godot4`). If it's there, the project can be
  imported, checked and even run headless.
- **Pygame:** `python3 -c "import pygame"`. If it's there (or can be installed
  with `pip install --user pygame`), the game can be run and tested headless
  with `SDL_VIDEODRIVER=dummy`.
- **LÖVE:** `love --version`.
- **Unity, Unreal:** these editors almost never run in a container. Plan to
  hand over a project the person opens on their own computer.

If the engine can't run here, tell the person early, in `design/STATUS.md`
and in the final report, that the game was built but not played, and lean on
reviews: the Builder and Bug hunter reviews matter even more.

## Building

- Use the engine's normal project layout and its current stable version (look
  it up rather than guessing). Keep the project self-contained: everything
  needed is in the folder.
- Import the assets the way that engine expects (Godot `.import` files are
  generated on first open; Unity needs `.meta` files only after opening; for
  Unreal, keep the source art in a `RawAssets/` folder with import notes).
- Follow the same milestones as SKILL.md: playable core, art and sound, all
  content, the whole game, polish.
- Desktop and mobile settings: set the engine's window, stretch and touch
  options to match the design's platform setting.
- Write scripts in the engine's own language (GDScript for Godot, C# for
  Unity, C++ or Blueprints notes for Unreal, Lua for LÖVE, Python for Pygame).

## Testing

- **Engines that run here:** run the project headless (Godot:
  `godot --headless --path <project> --quit` to check it loads; a test scene
  or script that plays through levels). Pygame: a test mode that steps the
  game without a window and checks each level can be finished.
- **Engines that don't:** check what can be checked without them (scripts
  parse, every referenced asset exists, scene files are well formed), and say
  plainly what wasn't tested.

## Handing over

The README explains, step by step, how to open and run the project in that
engine (which version to install, how to open the folder, which scene to run,
how to export for desktop and phones).
