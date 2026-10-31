# Publishing a game

`--publish` puts a finished web game online with GitHub Pages, at a free
GitHub address or the person's own, and can add it to a website that lists
their games. Run with `--publish` on a finished game, or at the end of Phase 8
when the request asked for it ("…and publish it").

The GitHub calls go through `scripts/publish.sh` (run it as
`bash "${CLAUDE_SKILL_DIR}/scripts/publish.sh" <command>`). It prints plain
`label: value` lines; turn them into plain words for the person.

Only web games publish this way. For other targets, say that publishing is for
web games and stop.

## 1. Check, and work out where it goes

Change nothing until the person confirms in step 2.

1. **Signed in?** `publish.sh check`. If it fails, tell them how to sign in
   (its message says), and that nothing was changed, then stop.
2. **Already published?** If the game folder is the root of a git repository
   whose `origin` is on GitHub, this is an update: skip to "Updating a
   published game".
3. **The address.** In order: the `--publish` value; otherwise
   `GAMEGEN_DOMAIN` (`publish.sh settings` reads it); otherwise the free
   GitHub address.
   - `github.io` (or nothing set): `https://<account>.github.io/<repo>/`.
   - A bare domain, like `synapticnoise.com`: `<name>.synapticnoise.com`,
     where `<name>` is the game's name in lowercase letters and digits only
     (`Pomegranate Panic 3` gives `pomegranatepanic3`).
   - A full host, like `pp3.synapticnoise.com`: exactly that.
4. **The listing site.** In order: `--site`; otherwise `GAMEGEN_SITE`;
   otherwise, for a custom address, the site at the bare
   domain (`synapticnoise.com`) if one of the person's repos serves it with
   GitHub Pages (find it with
   `gh api repos/<account>/<repo>/pages --jq .cname` on their repos whose
   name looks like the domain, then the rest). `--site none`, or nothing found,
   means no listing. A site that isn't the person's repo gets a card to paste
   instead (see step 6).
5. **The repo name.** The game's folder name (kebab-case). `publish.sh repo
   <account>/<name>`: if it's taken, use the free name it suggests and say
   what's already there. Never reuse an existing repo unless the person says
   so, and then ask once more, because pushing replaces what's there.
6. **The game folder must be its own repository.** If it isn't in git, it
   will be set up in step 3. If it's a folder inside a bigger repository,
   ask: publish it as its own repo (recommended: the game folder becomes its
   own repository, and the bigger one ignores it), or not at all.

## 2. Confirm, in one line

Show one line with everything, and ask. For example:

> Publish Pomegranate Panic 3 as a new public repo, zeveck/pomegranate-panic-3,
> at https://pomegranatepanic3.synapticnoise.com, and add it at the top of
> synapticnoise.com? (yes/no)

Include the repo note when the name was taken ("zeveck/barbarain already
exists (a private Conan text adventure, last updated April 25), so this
uses zeveck/barbarain-2"). Say where the card goes: at the top, unless the
site's cards are clearly in another order (alphabetical, oldest first), then
where that order puts it.

A plain "no": say nothing was published, and how to change it
(`/gamegen --publish <address>`, `--site none`). Anything else ("yes, but
call it…", "don't list it") is a correction: adjust, show the line again, and
ask again.

## 3. Get the repository ready

1. **What goes in:** the game (`game/`), `README.md`, `media/`, `LICENSE` if
   there is one, `.gitignore` and `.github/workflows/pages.yml`. With
   `--making-of` (or `GAMEGEN_MAKING_OF=on`), also `design/`, and make sure
   the README has its "How it was made" section. Without it, `.gitignore`
   keeps `design/` out, and the README says nothing about how it was made.
2. **What never goes in:** `.gitignore` must keep out `.env`, `.gamegen/`,
   `.anim8gen/`, `assets/anim8gen/`, `.playwright/` and `.*-history.jsonl`.
   Before the first commit, look at what's staged (`git status`) and search
   it for anything that looks like a key (`sk-`, `AIza`, `xi-api-key`,
   `ghp_`, `github_pat_`, long random strings next to `key` or `token`). If
   anything turns up, stop and tell them.
3. **The Pages workflow** is at the repository's root with `GAME_DIR` set to
   `game` (move it there, and fix `GAME_DIR`, if Phase 8 put it in a bigger
   repository).
4. **The address in the game.** In `game/index.html`: `<link rel="canonical">`
   and `og:url` set to the address, `og:image` and `twitter:image` as
   absolute URLs of `social-card.jpg`, plus `robots.txt` and a one-page
   `sitemap.xml` in `game/` (see "Sharing and search" in web-target.md).
   In the README, the "Play" link points at the address.
5. If the folder isn't in git yet: `git init -b main`. Commit with a plain
   message ("Pomegranate Panic 3, ready to play").

## 4. Publish

1. `gh repo create <account>/<repo> --public --description "<tagline>"`
   (no `--push` yet: Pages must be on before the first push, or the first
   deploy fails). Add it as `origin`.
2. `publish.sh pages <account>/<repo> [host]`. For a custom address, run
   `publish.sh dns <host> <account>` first: if the DNS isn't set up, publish
   at the GitHub address for now, and tell them the exact record to add and
   to run `/gamegen --publish` again once it's in (it then moves the game to
   their address).
3. `git push -u origin main`, then wait for the deploy:
   `gh run watch --exit-status $(gh run list --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')`.
4. For a custom address: `publish.sh https <account>/<repo>`. If it says
   it's still waiting, carry on and say HTTPS will switch on by itself within
   the hour (running `--publish` again then turns on "HTTPS required").
5. Load the address (`curl -sL`): it answers 200 and the page has the right
   canonical link and preview image. GitHub can take a minute or two to
   update; try a few times before calling it broken.

## 5. Add it to the listing site

Clone the site's repo into `.gamegen/site/` and find the page that links the
person's other games. Add a card for this game in exactly the same style as
the others: the same HTML, its social card as the picture, the README's
tagline or first sentence as the description, and a link to the address.
Put it where the confirmation said. If the site has a `sitemap.xml`, add the
game's address to it. Commit ("Add Pomegranate Panic 3"), push, and check the
live site shows the new card (it can take a few minutes).

If the site has no games on it yet, show the person the card and where it
would go, and ask before pushing. If the site isn't one of their repos, give
them the finished card to paste.

## 6. Report

Short and happy: the game's address, first and on its own line; the repo; the
listing site, if any; and anything still pending (DNS to add, HTTPS still
switching on), with exactly what to do. Updating later is just
`/gamegen --change …` and then `/gamegen --publish`.

## Updating a published game

The repo and address are already settled, so only confirm: "Update
Pomegranate Panic 3 at https://pomegranatepanic3.synapticnoise.com? (yes/no)".
Then commit what changed, push, wait for the deploy and check the live page.
If the title, tagline or social card changed, update the card on the listing
site too. If an earlier publish left something pending (DNS, HTTPS), finish
it now.
