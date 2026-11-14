# Changelog

gamegen uses the release date as its version: `vYYYY.M.D` (for example
`v2026.10.20`). A second release on the same day adds `.2`, a third `.3`, and
so on (`v2026.10.20.2`).

## v2026.11.14.5

- Bug reports from players are treated as reports, not orders. When
  `--change #12` fixes an issue someone else filed, gamegen reads it only to
  understand what's wrong, tells you what it plans to change, and asks
  first, even with `--no-confirm`. Your own issues are your requests, as
  usual. And no issue, even yours, can make it run commands or touch your
  keys, settings, publishing or other repos.
- A game in a private repo no longer shows a "Report a bug" button players
  can't use: publishing leaves it out, and says so.
- Publishing sets up bug reports in the right order: the label and the
  issues setting are made once the repo exists, not before.
- Publishing won't replace a website you already have. If a repo has a site
  gamegen didn't set up, it says what's there and asks before putting the
  game in its place, even with `--no-confirm`.
- Fewer stalls: waiting for a new address to reach GitHub, and long
  play-test runs, no longer get cut off part way.
- 3D games get the 3D guide in their final polish check, and the pretend
  controller works in 3D play-tests.
- Small fixes to the help, the packaging test and the README (the GitHub
  preview picture is now listed in what you get).

## v2026.11.14.4

- Games are honest on the device they weren't made for. A game for computers
  opened on a phone (with touch alone) now says so kindly, says what can and
  can't be done by tapping, and offers to send you the link for later; a
  keyboard or controller makes it go away. Touchscreen laptops and the desktop
  apps never show it. The README says which devices a game is for (#25).

## v2026.11.14.3

- No more flashes between screens. When one screen closes and the next opens
  a moment later (between story pictures, or two lines of a conversation),
  the game could show what's underneath for a frame or two: too quick for a
  screenshot, but players see it, often right at the start. Games now hand
  screens over cleanly, and the play-test checks the opening and every story
  scene frame by frame (#23).

## v2026.11.14.2

- Play-tests serve the game with caching off, so a long test session never
  keeps testing old code after a fix (#15).
- Long play-test runs (replaying every level, playing the whole game) now
  report progress as they go, stop themselves when stuck, and get checked
  while they run, instead of looking healthy while looping. 3D games can skip
  drawing during those runs, which makes them many times faster (#15).

## v2026.11.14

- **A preview picture for your game's GitHub repo.** Links to the repo used
  to show GitHub's plain card of its name and description (and link previews
  kept showing old wording long after it changed). gamegen now makes a
  1280x640 picture from the game's own art, and when publishing asks you to
  upload it in the repo's settings (GitHub only lets you do that yourself),
  reminding you until it's there (#26).

## v2026.11.13.7

- Publishing a game with its making-of notes now includes the tools that
  replay its recorded level solutions, with a "Replaying the tests" section
  in its README, so the game can still be checked level by level from its
  repo (#24).

## v2026.11.13.6

- Adding "Report a bug" to a game never changes its existing controls: the
  shortcut fits around the game, never the other way round.

## v2026.11.13.5

- The "Report a bug" form fits on phones: held upright it was half off the
  screen, and held sideways it was taller than the screen (a fix in
  gh-feedback).

## v2026.11.13.4

- **Ctrl+Shift+F reports a bug from anywhere** in a game with `--feedback`,
  even when it's stuck and its menus can't be reached: on the web and in the
  desktop apps, and with `hidden` too, for testers. It never uses one of the
  game's own keys, so normal play can't open it.

## v2026.11.13.3

- The "Report a bug" form no longer jumps back to its title box when a
  player tabs or clicks to another field straight after opening it, or
  closes it at once (a fix in gh-feedback).

## v2026.11.13.2

- **`--gamepad`: play with a controller.** Plug a PS5 controller into your
  computer (USB or Bluetooth), press any button, and play the whole game
  with it, menus and all. Xbox, Switch Pro and most other controllers work
  too, and the game shows the buttons of the one you're holding (✕ ○ □ △
  for PlayStation). The play-test plays it with a pretend controller.
- **`--feedback`: a "Report a bug" button.** In the pause menu and settings,
  it lets players report a problem as a GitHub issue in the game's repo,
  filled in with where they were in the game and any errors, and with a
  screenshot of the moment ready to paste. `--feedback hidden` shows it only
  to people who open the game with `?feedback` on its address, such as
  testers. Publishing sets up the repo for it, and `--change #12` fixes what
  comes in. Players need a GitHub account.

## v2026.11.13

- Publishing to a new address on your own domain gets HTTPS on its own.
  GitHub sometimes never asks for the certificate when the address is set
  before its DNS has spread, so publishing now waits a few minutes for DNS
  first, and if no certificate has started a couple of minutes later, it
  re-saves the address to nudge GitHub (the same as saving it again in
  Settings > Pages). If it still times out, it says how to nudge it by
  hand (#22).

## v2026.11.11.2

- **Fix GitHub issues with `--change #12`** (or several, or an issue's
  address), with your own notes alongside if you like. gamegen reads each
  issue and its screenshots, checks it's really something to change, and
  fixes it; the issues close by themselves when you next publish. It never
  comments on, labels or closes issues itself.
- Behind the scenes, the skill's main file is about 15% shorter: the detail
  for continuing, changing and setup now lives in its own reference files,
  read only when needed.

## v2026.11.11

- **`--share-design [page|doc|both]`** shares the reviewed design on
  claude.ai, so others can weigh in before the real work starts: a web page
  (the default), a Claude Doc people can comment on, or both to compare.
  It shows how big the game is and what's hardest, without prices. With
  `--plan-only` it's ready as soon as the design is done. When you
  continue, gamegen reads the comments, uses what fits (and says which),
  and keeps the shared design current.
- **`--mockups <dollars>`** (default $5) makes a few mock pictures of the
  main characters and places for the shared design, so reviewers can react
  to the look too. They come out of the game's budget, and the best often
  becomes the start of its art.
- **Estimates are forecasts, not promises.** The design now has an "effort
  and cost estimate" (how big the game is and its hardest parts, and roughly
  what it'll cost), and the reviews, play-test and polish pass make new art
  or sound whenever it clearly helps, even past the estimate. Only
  `--budget` limits spending.

## v2026.11.6.3

Fixes from a bug sweep:

- Packaging works for game names with characters Windows doesn't allow in
  file names, such as "Hades Rises: Part 2" (the app is named "Hades Rises
  Part 2"), and checks for the `zip` command before building (#16).
- `--finish` copies everything that's part of the game, including work you
  never committed and ignored files such as big audio (never secrets,
  dependencies or build output), and creates nothing until you approve its
  plan (#17).
- `--no-confirm` now means "don't stop for approvals I'd give anyway": the
  publish "Go ahead?" and the plan for `--finish` and `--remake`. Unclear
  questions get the cautious choice, said in the first update, and safety
  stops still stop (#18).
- Publishing from a branch (such as after `--finish --in-place`) offers to
  move `main` up to it first, and only ever as a plain fast-forward (#19).
- A game started in its own layout is offered a move into `game/` in the
  plan; without it, publishing and packaging say what's needed and stop
  (#20).
- `--package` runs without stopping for permission to run its build, and
  the help's examples can be pasted as they are (#21).

## v2026.11.6.2

- **Finish or remake a game you started**, by hand or with other tools,
  without losing what you put in. `--finish <folder or repo>` makes it whole
  in a copy that becomes its own repo; `--finish … --in-place` works in your
  original project on a new branch; `--remake <folder or repo>` makes it
  again as a new game in a new repo, keeping your art, levels and ideas.
  Your original is never changed. `--leeway little|some|lots` says how
  freely gamegen may change it, and your own words ("keep my art exactly",
  "the frog swarm is on purpose") beat that. gamegen plays the game, looks
  through everything, and shows you its plan before it starts.

## v2026.11.6

- **`--package`** turns a finished game into apps that run without a
  browser: `--package windows` (a folder with an `.exe`, and a zip),
  `--package linux` (it runs on Steam Deck too), or `--package steam` (the
  default), which also makes the store images, the store text, the files
  for uploading builds, and a checklist of what's left to do in
  Steamworks. The game gets a Quit button, full screen and controller
  support; everything else plays as on the web.
- **A guide to putting your game on Steam**, at
  https://gamegen.synapticnoise.com/steam-guide/ (and in `docs/` here):
  Steamworks, the store page, uploading, Valve's reviews and releasing.

## v2026.11.5.2

- **`--no-confirm`**: with `--publish`, publish without stopping to ask "Go
  ahead?" first, such as `/gamegen --change … --publish --no-confirm`.
  gamegen still says what it's doing and reports what it did, and still
  stops if anything looks wrong (something like a key about to go online, a
  private repo that would need to be made public, a repo that isn't this
  game's).
- The hint shown after typing `/gamegen` is short enough to read: your game
  idea, the common options, and `help` for the rest.

## v2026.11.5

- Adding DNS records at GoDaddy uses a **personal access token**
  (`GODADDY_API_TOKEN`), the kind GoDaddy now issues, with just two
  permissions: `domains.domain:read` and `domains.dns:update`. GoDaddy's
  older key and secret still work.

## v2026.11.4.3

- **Publishing can add each game's DNS record for you** on your own domain,
  so a new game goes live at its address in one go. Turn it on with
  `GAMEGEN_DNS=godaddy` and a GoDaddy API key and secret in `.env`
  (`GODADDY_API_KEY`, `GODADDY_API_SECRET`). It only ever adds the one
  record a game needs (never changing or removing another), and says so
  before publishing. GoDaddy is the first supported; others can follow.
- `publish.sh dns-provider` checks your key and account without changing
  anything.

## v2026.11.4.2

- Published games link back from their title screen: a small link to your
  gallery in the lower-left corner (such as `synapticnoise.com`), and with
  `--making-of`, a small GitHub link in the lower-right to the game's repo.
  They stay out of the way on desktop and phones, show only on the title
  screen, and tapping one never starts the game.

## v2026.11.4

- Publishing from a private repo you already have keeps it private. gamegen
  no longer claims GitHub Pages needs a public repo (paid GitHub plans
  publish from private ones). If GitHub does refuse, it tells you GitHub's
  reason and asks what you'd like, instead of deciding for you.

## v2026.11.3.4

- The depth questions are asked neutrally ("does it feel thin anywhere?"
  rather than "where does it feel thin?"), so reviewers don't go looking for
  thinness that isn't there, and small games don't get padded (#14).

## v2026.11.3.3

- The depth question is asked at design time too: the player reviewer checks
  whether the game is planned with as much to see, do and read as your
  request calls for, while a thin plan is still cheap to change (#13).

## v2026.11.3.2

- 3D games with animals or monsters that need to really move (swimming,
  flying, hopping, walking) follow meshgen's new guide to animating them,
  instead of simple bobbing and swaying (#11). This needs meshgen 2026.11.2
  or newer; gamegen tells you if yours is older.

## v2026.11.3

- **The whole game gets played in one go.** Besides proving each level can be
  finished, the play-test plays from New Game to the win screen in one run,
  where problems that carry over between parts show up (#12).
- **The final playtester checks depth:** is there as much to see, do and read
  as this kind of game and your request call for, and where does it feel
  thin?
- **Big games are written by a team.** A game with a lot of content
  (chapters, worlds, level sets) gets a shared bible first, then each part
  goes to its own helper, who builds it and plays it through.

## v2026.11.2.2

- gamegen's plugin is now called **gamegen** instead of `gg`, so it reads the
  same everywhere: `/gamegen` (or `/gamegen:gamegen`), `/plugin`, and the
  install command, `/plugin install gamegen --marketplace zeveck/gamegen`.
- **Had it installed as `gg`?** After updating the gamegen marketplace, run
  that install command once to switch over. Your settings and the art, sound
  and 3D plugins carry across. (Until you do, gamegen won't load.)

## v2026.11.2

Art that makes the game feel finished (#10):

- gamegen makes every piece of art that clearly improves the game, and treats
  the budget as a limit to stay within, not a target to stay well under.
- Once the first art shows what things really cost, it looks at the art plan
  again and adds what would make the game look more finished.
- The design review asks whether the game looks as finished as the request
  deserves: are the big moments shown, do the characters who speak have
  faces, and do the characters who move have animations?

## v2026.11.1.6

A leaner skill, aimed squarely at a fun, finished game (#9):

- Game sizes are described by what they're like to play (a few minutes, half
  an hour, an hour or more), not by counts of art and songs.
- The polish checklist is written once, for the polish reviewer. The final
  playtester sticks to what only a player can judge: fun, clarity, difficulty
  and sound.
- Art or sound that won't come out right gets a different approach (simpler,
  another tool, or drawn in code) before it's ever dropped.
- The rule about crediting you moved from the top of the skill to where
  credits are written; it works the same.

## v2026.11.1.5

- The playtester and polish reviewer now know where gamegen's folder is, so
  they can run the text scanner and the first-load filmstrip instead of
  getting "No such file" (#8).

## v2026.11.1.4

Games come out the size you described, and nothing gets cut to finish
sooner (#7):

- gamegen's top rule is now: "Racing to say 'done' but producing slop is a
  fail. It's fine to take longer to get it right. Be careful."
- Without `--scope`, the size comes from your request instead of always
  medium, and the first update says which size and why, so you can change it.
- Lines that let a run cut corners are gone: no dropping a feature after a
  few failed fixes, no cutting to save time, and a second final review
  whenever the first finds something that must be fixed.
- The "looking finished" guidance is down to a few lines of principle, so it
  fits every game; the polish pass, text scanner and first-load filmstrip
  still check for those problems.

## v2026.11.1.3

Fixes from a bug review (#6):

- On a Mac, publishing no longer reports a taken repository name as free (the
  check used bash 4 syntax that macOS's bash 3.2 can't run).
- The text scanner no longer crashes on text inside an SVG.
- 3D play-tests really control time: the `step` hook now pauses the game's own
  loop, so recorded solutions replay the same way every time.
- Publishing uses one remote name (`github`) throughout, so a game whose
  `origin` points elsewhere isn't published twice.
- A 3D game's README credits meshgen in "How it was made".

## v2026.11.1.2

- gamegen shows as **gamegen** in `/plugin` (it still installs as `gg`, and
  `/gamegen` works as before) (#4).
- **Staying up to date** (#5): each run checks whether gamegen or any plugin
  it uses is out of date, and says which command updates it. It never stops
  a run for it, and stays quiet when offline. The README says how to turn on
  auto-update, and how to uninstall everything in one go.
- Behind the scenes, a daily check makes sure the latest versions of the art,
  sound and 3D plugins still do everything gamegen relies on.

## v2026.11.1

- **3D games, when you ask for one** (#3): `--3d`, or "3D" in your idea.
  Characters start as a picture, then meshgen (a new companion plugin, using
  Meshy) turns them into animated 3D models; props and weapons too. Web games
  are built with three.js, bundled with the game; Godot games get the models
  ready to use. Every other game stays 2D, and 2D games work exactly as
  before.
- If your idea sounds like 3D but doesn't say so (first-person, Unreal,
  low-poly), gamegen asks you straight away, before starting, rather than
  building the wrong kind of game.
- 3D games need a Meshy key (`MESHY_API_KEY`); the setup check tests it for
  free, only for 3D games.

## v2026.10.31.7

Games look finished, not just working (#1):

- **A polish pass** before wrap-up: a fresh reviewer who didn't build the
  game goes over every screen at every size with a checklist of what players
  notice first: code showing as text, lone last words, cut-off text, pop-ups
  covering the action, names written differently, icons, the first load.
- **The play-test reads the words on screen**, at every screenshot, with a
  new text scanner, and opens everything every button opens (credits,
  settings, help), not just the main screens.
- **It films the first load** on a slow connection, so a title that
  flickers, changes font or jumps as it loads gets caught.
- **Publishing looks at the live game**: screenshots at a desktop and a phone
  size, the console, and a popup or two, not just the address answering.
- Web games build in balanced line breaks, a title that waits for its fonts
  and art and then fades in once, one set of matching SVG icons, a single
  queue for pop-up messages, and names that shrink to fit before they're
  cut off.
- A check is never told to skip something: fix the cause instead.
- Every game's definition of done now says every screen looks finished at
  every size.

## v2026.10.31.6

- Games credit the right person. The name comes from `GAMEGEN_CREDIT` in
  your `.env`, or else your GitHub or git name, and with no name at all the
  credit is left out. gamegen never fills in a made-up one like "the player"
  (#2).
- Publishing tells you whose name the game credits before it goes online,
  so you can change it. The wrap-up report says which name was used.

## v2026.10.31.5

- When the repo name only redirects to one you renamed, publishing says
  that using it ends the redirect, so old links reach the new game.

## v2026.10.31.4

- Publishing sees a repo name you've renamed away from as free (GitHub only
  redirects it), instead of as taken by the renamed repo.

## v2026.10.31.3

- Publishing tells you what it's about to do in a few plain sentences before
  asking: the address, the repo and what goes in it, the gallery spot, and
  anything that comes later (DNS, HTTPS). An update says what's changed since
  the game was last published.
- A blank line above the game's name, so it stands apart from the chat.

## v2026.10.31.2

Versions are now the release date, with `.2`, `.3` for later releases the
same day. v2026.11.1 to v2026.11.6 were all released on October 31, under an
older rule that used the next day's date for each same-day release.

- Publishing's question is one short sentence: where the game goes, with a
  few words in brackets only when something's unusual (a taken repo name,
  DNS not ready yet).

## v2026.11.6

- The game's name above the prompt leaves out the "status" label older games
  have in their `design/STATUS.md` heading (`# BarbarAIn — status` shows as
  BarbarAIn).

## v2026.11.5

- While you work on a game, its name shows above the prompt, so you always
  know which game you're on. It's the game in the folder you're in, or the
  one you changed most recently in the folders below it. Click `[-]` beside
  it to fold it away.
- `design/STATUS.md` starts with the game's name as a heading.

## v2026.11.4

- Whenever gamegen needs to ask you something, not just when publishing, it
  asks in plain words and waits for your reply, never with a multiple-choice
  prompt.

## v2026.11.3

- Publishing asks its questions in plain words and waits for your reply,
  instead of with a multiple-choice prompt, so you can answer with a
  correction in your own words.

## v2026.11.2

- A new game goes at the top of your gallery, newest first, or just before
  the game it's a sequel to (Pomegranate Panic 3 before Pomegranate Panic 2).
  Publishing says where when it asks, and you can name another place. It no
  longer works out an order from the page, and never moves the games already
  there.

## v2026.11.1

- `--site` is now `--gallery` (and `GAMEGEN_SITE` is `GAMEGEN_GALLERY`): a
  GitHub repository showing all your games together. If it doesn't exist
  yet, publishing offers to start it; each game is added the way the gallery
  already shows the others. It's only used when you set it: publishing no
  longer searches your repositories for a site.
- Every publish ends with the game's link, title, description and picture,
  for adding it to any other site by hand.

## v2026.10.31

- **Publish a game:** `/gamegen --publish` puts a finished web game online with
  GitHub Pages, free. It makes a public repository and publishes at
  `<you>.github.io/<game>`, or at your own domain (`--publish example.com`
  gives `<game>.example.com`, with a check of the DNS record and HTTPS
  switched on). If the site at that domain is yours on GitHub Pages, the game
  is added to its list of games (`--site` picks another site, `--site none`
  skips it). It shows where everything will go and asks first; "no" changes
  nothing. It never reuses an existing repository without asking. Publishing
  again updates the live game.
- **`--making-of`:** the README shows how the game was made: every request,
  exactly as typed (changes and notes included now, not just the first), and
  what gamegen and each plugin did. Publishing then includes the design notes.
  Without it, the README is all about the game.
- `GAMEGEN_DOMAIN`, `GAMEGEN_SITE` and `GAMEGEN_MAKING_OF` in your `.env` set
  your defaults; the `.env` gamegen makes lists them.
- A `.env` is made for any missing keys, and kept out of git.
- ElevenLabs is credited only when your plan is the free one, going by the
  setup check, or by the first sound when the key can't read the plan.
- The dev container comes from
  [devcontainer-plus](https://github.com/zeveck/devcontainer-plus).

## v2026.10.21

- First version. `/gamegen <your game idea>` checks your API keys work, designs
  a game, reviews the design with player, builder and art-and-sound-director
  agents, makes the art, animation, music and sound with imagegen2, nanogen,
  anim8gen and audiogen, builds it (a web game for desktop and phones by
  default), play-tests it, makes a link-preview image, and finishes with a link
  to play it.
- Options: `--platform`, `--style`, `--target`, `--scope`, `--budget`,
  `--rounds`, `--plan-only`, `--continue`, `--change` and `--out`.
  `/gamegen help` lists them and `/gamegen help <option>` explains one.
- One-line install: `/plugin install gg --marketplace zeveck/gamegen` installs
  gamegen with imagegen2, anim8gen, audiogen and nanogen, all listed in the
  gamegen marketplace. The skill shows as `/gg:gamegen`, or just `/gamegen`.
- Dev container from github.com/zeveck/devcontainer-plus.
