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
2. **Already published?** It's an update when the game folder is the root of
   a git repository whose `origin` is a GitHub repo the person can push to
   (`gh api repos/<owner>/<repo> --jq .permissions.push` says `true`) and that
   has a Pages site (`gh api repos/<owner>/<repo>/pages` works). Then skip to
   "Updating a published game". With an `origin` they can push to but no
   Pages site, publish into that repo (it's already the game's own) and skip
   creating one. With an `origin` they can't push to, publish as a new repo
   and leave that `origin` alone (add the new one as `github`).
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
4. **The listing site.** In order: `--site`; otherwise `GAMEGEN_SITE`;
   otherwise, for a custom address, the site at the bare domain
   (`synapticnoise.com`) if one of the person's repos serves it with GitHub
   Pages (check `gh api repos/<account>/<repo>/pages --jq .cname` on their
   repos whose name looks like the domain first, then the rest). `--site
   none`, or nothing found, means no listing. A site that isn't one of their
   repos gets a card to paste instead.
5. **The repo name.** The game's folder name (kebab-case). `publish.sh repo
   <account>/<name>`: if it's taken, use the free name it suggests and say
   what's already there. If it says it couldn't check, try again; never
   guess. Never reuse an existing repo unless the person says so, and then
   ask once more, because pushing replaces what's there.
6. **Inside a bigger repository?** If the game folder is part of a bigger git
   repository (not its root), it's published as its own repo: the game folder
   becomes its own repository, and the bigger one's `.gitignore` gets the
   folder added. Any Pages workflow Phase 8 put at the bigger repository's
   root for this game moves into the game folder. Say all this in the
   confirmation.

## 2. Confirm, in one line

Show one line with everything, and ask. For example:

> Publish Pomegranate Panic 3 as a new public repo, zeveck/pomegranate-panic-3,
> at https://pomegranatepanic3.synapticnoise.com, and add it at the top of
> synapticnoise.com? (yes/no)

Add what applies, briefly:

- The name was taken: "zeveck/barbarain already exists (a private Conan text
  adventure, last updated April 25), so this uses zeveck/barbarain-2."
- DNS isn't set up yet: "Its DNS isn't set up yet, so it'll start at
  https://zeveck.github.io/barbarain-2/ and move once you add the record."
- Inside a bigger repository: "It becomes its own repo, so my-project will
  ignore the barbarain folder."
- The listing site isn't their repo: "I'll give you a card for
  example.com" instead of "add it to example.com".
- The card's place: at the top, unless the site's cards are clearly in
  another order (alphabetical, oldest first), then where that order puts it.

A plain "no": say nothing was published, and how to change it
(`/gamegen --publish <address>`, `--site none`). Anything else ("yes, but
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
   deploy fails). Add it as `origin`.
2. `publish.sh pages <account>/<repo> [host]`, with the host only if its DNS
   is ready (or the person said it's fine). It prints the address.
3. `git push -u origin main`, then wait for the deploy of that commit. Its run
   can take a few seconds to appear, so look for it a few times:
   `gh run list --workflow pages.yml --commit "$(git rev-parse HEAD)" --json databaseId --jq '.[0].databaseId'`,
   then `gh run watch <id> --exit-status`.
4. For a custom address: `publish.sh https <account>/<repo>`, with the Bash
   tool's timeout set to 600000 (it waits up to 9 minutes for GitHub's
   certificate). If it's still waiting, carry on: the game already works at
   its address, and running `/gamegen --publish` later makes HTTPS required.
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

Work out the address as in step 1.3, starting from where it is now (the
Pages address, `gh api repos/<owner>/<repo>/pages --jq .html_url`). It
changes only when `--publish` names a different one, or when it's on
github.io waiting for DNS that's now ready. Confirm in one line:

> Update Pomegranate Panic 3 at https://pomegranatepanic3.synapticnoise.com? (yes/no)

or, when it moves: "Update Barbarain and move it from
https://zeveck.github.io/barbarain-2/ to https://barbarain.synapticnoise.com?"

Then:

1. Get the repository ready as in step 3 (with the new address, if it moved),
   including the check before committing.
2. If it moved: `publish.sh pages <owner>/<repo> <host>`.
3. Push, and wait for that commit's deploy (step 4.3).
4. If it's on a custom address and HTTPS isn't required yet:
   `publish.sh https <owner>/<repo>` (step 4.4).
5. Check the live page (step 4.5).
6. If it moved, or the title, tagline or social card changed, update its card
   on the listing site (step 5). If it was never listed and the site settings
   now point at one, add it.
