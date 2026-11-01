# Publishing a game

`--publish` puts a finished web game online with GitHub Pages, at a free
GitHub address or the person's own, and, if they ask for one, adds it to a
gallery of their games. Run with `--publish` on a finished game, or at the end of Phase 9
when the request asked for it ("…and publish it").

Whenever this asks the person something, ask in plain words as the last line
of your reply and end your turn to wait for their answer, as SKILL.md says:
never a question tool or a multiple-choice prompt. Their answer may be a
correction in their own words.

The GitHub calls go through `scripts/publish.sh` (run it as
`bash "${CLAUDE_SKILL_DIR}/scripts/publish.sh" <command>`). It prints plain
`label: value` lines; turn them into plain words for the person.

Only web games publish this way. For other targets, say that publishing is for
web games and stop.

## 1. Check, and work out where it goes

Change nothing until the person confirms in step 2.

1. **Signed in?** `publish.sh check`. If it fails, tell them how to sign in
   (its message says), and that nothing was changed, then stop.
2. **Already published?** It's an update when the game folder is the root of
   a git repository whose `origin` (or `github`, a remote an earlier publish
   added) is a GitHub repo the person can push to
   (`gh api repos/<owner>/<repo> --jq .permissions.push` says `true`) and that
   has a Pages site (`gh api repos/<owner>/<repo>/pages` works). Then work
   out the address and the gallery (items 3 and 4 below) and follow
   "Updating a published game". With an `origin` they can push to but no
   Pages site, publish into that repo (it's already the game's own) and skip
   creating one. With an `origin` they can't push to, publish as a new repo
   and leave that `origin` alone (add the new one as `github`, and push to
   `github` from then on).
3. **The address.** In order: the `--publish` value; otherwise
   `GAMEGEN_DOMAIN` (`publish.sh settings` reads it); otherwise the free
   GitHub address.
   - `github.io` (or nothing set): `https://<account>.github.io/<repo>/`.
   - A bare domain, like `synapticnoise.com`: `<name>.synapticnoise.com`,
     where `<name>` is the game's name in lowercase letters and digits only
     (`Pomegranate Panic 3` gives `pomegranatepanic3`).
   - A full host, like `pp3.synapticnoise.com`: exactly that.
   For a custom address, run `publish.sh dns <host> <account>` now, so the
   confirmation can say if DNS still needs setting up.
4. **The gallery.** Only from `--gallery`, otherwise `GAMEGEN_GALLERY`; never
   work it out or search for one. Nothing set, or `none`, means no gallery:
   don't mention galleries at all. Otherwise it names a GitHub repo
   (`zeveck/synapticnoise`):
   - It exists and they can push to it
     (`gh api repos/<repo> --jq .permissions.push`): clone it into
     `.gamegen/gallery/` now (changing nothing yet) and find how it shows
     the games. A new game goes first, at the top, or, if it's a sequel to a
     game already there (the same name with a number, like Pomegranate
     Panic 3 to Pomegranate Panic 2), right before that game, so a series
     reads newest first. Never work out any other order from the page or
     its history, and don't move the games already there. If it shows no
     games yet, or it isn't clear how, plan to show the person what you'd
     add.
   - It doesn't exist (`publish.sh repo` says it's free) and it's under
     their own account: offer to start it, in the confirmation. Its address
     will be `https://<account>.github.io/<name>/`, or
     `https://<account>.github.io/` if it's named `<account>.github.io`.
   - It exists but they can't push to it, it's under someone else's account,
     or it isn't a repo name: say so plainly in the confirmation, and carry
     on without it.
5. **The repo name.** The game's folder name (kebab-case). `publish.sh repo
   <account>/<name>`: if it's taken, use the free name it suggests and say
   what's already there. If it says it couldn't check, try again; never
   guess. Never reuse an existing repo unless the person says so, and then
   ask once more, because pushing replaces what's there.
6. **Inside a bigger repository?** If the game folder is part of a bigger git
   repository (not its root), it's published as its own repo: the game folder
   becomes its own repository, and the bigger one's `.gitignore` gets the
   folder added. Any Pages workflow Phase 9 put at the bigger repository's
   root for this game moves into the game folder. Say all this in the
   confirmation.

## 2. Confirm

Tell the person what's about to happen in a few plain, concrete sentences,
then ask. For example:

> BarbarAIn will go live at https://barbarain.synapticnoise.com.
> zeveck/barbarain is your old private text adventure, so I'll make a new
> public repo, zeveck/barbarain-2, with the game, its README (screenshots and
> your prompts) and the design notes. Then I'll add BarbarAIn to the top of
> synapticnoise.com, linking to the game. HTTPS can take a few minutes to
> switch on after that. It credits the idea to Rich Conlan. Go ahead?

- **Start with the address**, since that's what they care about most.
- **Then what you'll do, in things they'd recognise:** the repo (and why, if
  the name was taken, naming what's there: "your old private text
  adventure"), what goes in it (the game, the README, and the design notes
  with `--making-of`), and where it goes in the gallery ("the top of
  synapticnoise.com", or "just before Pomegranate Panic 2" for a sequel).
- **The credit.** Say whose name the game and README credit (from
  `design/STATUS.md`, or `publish.sh credit`), since this is when it goes
  public: "It credits the idea to Rich Conlan." If no name is known, say it
  credits no one, and they can give a name. A name they give replaces it
  everywhere it appears (in-game credits, end screen, README, gallery) before
  committing, and `design/STATUS.md` notes it as confirmed. Never fill the gap
  with a stand-in.
- **A name that only redirects** (`publish.sh repo` says so): say that
  taking it ends the redirect, so old links reach the new game instead
  ("That name now just redirects to your renamed zeveck/barbarain-april26,
  so old links to it will reach the new game instead.").
- **Anything that won't happen straight away or at all**, in the same voice:
  DNS not set up yet ("It'll be at https://zeveck.github.io/barbarain-2/ for
  now, and move to barbarain.synapticnoise.com once you add its DNS
  record."), HTTPS still to come, a new gallery being started, a gallery
  that can't be used and why, or the game becoming its own repo out of a
  bigger one.
- **Leave out** how settings were decided and what's kept out of the repo.
- **End with a plain question** ("Go ahead?"), so a correction in their own
  words is a natural answer. If they ask for another spot in the gallery
  ("after Hoard Hopper"), use it. If it isn't clear how the gallery shows
  games, say you'll show the change first.

A plain "no": say nothing was published, and how to change it
(`/gamegen --publish <address>`, `--gallery none`). Anything else ("yes, but
call it…", "don't list it", "the DNS is fine, it's behind Cloudflare") is a
correction: adjust, show the line again, and ask again.

## 3. Get the repository ready

1. **What goes in:** the game (`game/`), `README.md`, `media/`, `LICENSE` if
   there is one, `.gitignore` and `.github/workflows/pages.yml`. With
   `--making-of` (or `GAMEGEN_MAKING_OF=on`), also `design/`, and the README
   has its "How it was made" section. Without it, the README says nothing
   about how it was made, and `.gitignore` keeps `design/` out (if `design/`
   was published before, also `git rm -r --cached design`).
2. **What never goes in:** `.gitignore` keeps out `.env`, `.gamegen/`,
   `.anim8gen/`, `assets/anim8gen/`, `.playwright/` and `.*-history.jsonl`.
3. **The Pages workflow** is at the repository's root with `GAME_DIR` set to
   `game`.
4. **The address in the game.** In `game/index.html`: `<link rel="canonical">`
   and `og:url` set to the address, `og:image` and `twitter:image` as
   absolute URLs of `social-card.jpg`, plus `robots.txt` and a one-page
   `sitemap.xml` in `game/` (see "Sharing and search" in web-target.md).
   In the README, the "Play" link points at the address.
5. If the folder isn't in git yet: `git init -b main`.
6. **Before every commit** (first publish or update), look at what's staged
   (`git status`, `git diff --cached`) and search it for anything that looks
   like a key (`sk-`, `AIza`, `xi-api-key`, `ghp_`, `github_pat_`, long
   random strings next to `key` or `token`) or a private path. If anything
   turns up, stop and tell them. Then commit with a plain message
   ("Pomegranate Panic 3, ready to play").

## 4. Publish

1. Unless the repo already exists (step 1.2):
   `gh repo create <account>/<repo> --public --description "<tagline>"`
   (no `--push` yet: Pages must be on before the first push, or the first
   deploy fails). Add it as `origin` (or as `github`, when step 1.2 left
   another `origin` alone).
2. `publish.sh pages <account>/<repo> [host]`, with the host only if its DNS
   is ready (or the person said it's fine). It prints the address.
3. `git push -u origin main` (or `github`), then wait for the deploy of that
   commit. Its run can take a few seconds to appear, so look for it a few times:
   `gh run list --workflow pages.yml --commit "$(git rev-parse HEAD)" --json databaseId --jq '.[0].databaseId'`,
   then `gh run watch <id> --exit-status`.
4. For a custom address: `publish.sh https <account>/<repo>`, with the Bash
   tool's timeout set to 600000 (it waits up to 9 minutes for GitHub's
   certificate). If it's still waiting, carry on: the game already works at
   its address, and running `/gamegen --publish` later makes HTTPS required.
5. Load the address (`curl -sL`): it answers 200 and the page has the right
   canonical link and preview image. GitHub can take a minute or two to
   update; try a few times before calling it broken.
6. **Look at the live game,** not just its HTML: open the address with
   `playwright-cli` in fresh sessions at a desktop size and a phone size
   (see playtest-guide.md), take a screenshot of each and look at them,
   check the console for errors, run the text scanner, and open one or two
   popups (credits, settings) and close them. Something that only breaks
   online (a file name's case, a missing file, a path) shows up here. If
   anything's wrong, fix it, push again and check again before reporting.

## 5. Add it to the gallery

**Starting a new gallery:** make it in `.gamegen/gallery/` from
`templates/gallery.html`, saved as `index.html`: replace `GALLERY_TITLE`
with "<their name>'s games" (the confirmed credit, or `publish.sh credit`;
with no name known, just "Games"), and fill
in the example game with this one: `GAME_URL` is the game's address,
`GAME_IMAGE` the full address of its `social-card.jpg` (watch for a doubled
`/`), `GAME_TITLE` its name and `GAME_DESCRIPTION` the README's tagline or
first sentence. Add a short `README.md` ("<Name>'s games, to play at
<gallery address>", or "Games to play at …" with no name). Then `git init -b main`, commit, `gh repo create
<repo> --public --description "<Name>'s games"`, push, and
`publish.sh gallery-pages <repo>`. Check the gallery's address loads, then go
on to step 6.

**An existing gallery** (cloned in step 1.4): add this game the same way the
gallery already shows the others, whether it's an HTML page, a Markdown
list, a data file or anything else, and even if gamegen made it (the person
may have changed it since). Match the existing entries exactly (what they
show, in the same markup), using the game's address, title, the README's
tagline or first sentence, and its social card if the entries have
pictures. If it shows no games yet, or it isn't clear how, show the person
what you'd add and where, and ask before pushing. Put it where the
confirmation said. If the gallery has a `sitemap.xml`, add the game's
address to it. Commit ("Add Pomegranate Panic 3"), push, and check the live
gallery shows the new game (it can take a few minutes).

## 6. Report

Short and happy: the game's address, first and on its own line; the repo; the
gallery, if any; and anything still pending (DNS to add, HTTPS still
switching on), with exactly what to do, and that updating later is just
`/gamegen --change …` and then `/gamegen --publish`. End with what they'd
need to list it anywhere else by hand:

> **To list it elsewhere:** link https://…, title "…", description "…",
> picture https://…/social-card.jpg (1200×630).

## Updating a published game

Work out the address as in step 1.3, starting from where it is now (the
Pages address, `gh api repos/<owner>/<repo>/pages --jq .html_url`). It
changes only when `--publish` names a different one, or when it's on
github.io waiting for DNS that's now ready. Confirm the same way as step 2,
saying what's changed since it was last published (from the commits and the
requests in `design/STATUS.md` since then):

> I'll update BarbarAIn at https://barbarain.synapticnoise.com with what's
> changed since you last published: the boss fight at the end of the last
> cave and the bolder title. Its README and screenshots will be refreshed
> too, and its picture on synapticnoise.com updated to match. Go ahead?

When it moves, say so in the same sentence: "…and move it from
https://zeveck.github.io/barbarain-2/ to https://barbarain.synapticnoise.com,
now that its DNS is set up." Mention the gallery only when something there
changes, and the credit only if it's changed or was never confirmed.

Then:

1. Get the repository ready as in step 3 (with the new address, if it moved),
   including the check before committing.
2. If it moved: `publish.sh pages <owner>/<repo> <host>`.
3. Push, and wait for that commit's deploy (step 4.3).
4. If it's on a custom address and HTTPS isn't required yet:
   `publish.sh https <owner>/<repo>` (step 4.4).
5. Check the live page and look at the live game (steps 4.5 and 4.6).
6. If it moved, or the title, tagline or social card changed, update its entry
   in the gallery (step 5). If it was never in one and a gallery is now set,
   add it, or start it (step 5).
7. Report as in step 6.
