# Making a game's repo early (`--repo`)

`--repo` puts a game on GitHub now, as it is, before it's finished: so its
plan and work are safe, reachable from another computer, and (with
`GAMEGEN_PLANS`) shown on the plans page. It makes no website; `--publish`
does that later, in the same repo. Find the game as SKILL.md says (a
planned or half-built game is fine).

1. **Public or private:** `--repo public` or `--repo private`; otherwise
   `GAMEGEN_REPO` from `publish.sh settings`; otherwise ask ("Make Bloom
   Hop's repo public, so its plan and art can be shown, or private?").
2. **Already on GitHub?** If its remote is the repo `design/STATUS.md`
   names ("Repo: …"), this is an update: commit what's new (step 4's
   check), `git push` `main`, report, and stop. Any other GitHub remote:
   say so and stop.
3. **The name:** the game's folder name, as publish.md step 1.5 makes it
   (a taken name: use the free one it suggests and say what's there; never
   reuse an existing repo). If it's too early for a real name, ask.
4. **Get it ready.**
   - **Its own repo:** if `git rev-parse --show-toplevel` isn't the game
     folder, it's part of a bigger repo: the game folder becomes its own
     repo, as publish.md step 1.6 says (ask first). If it's already a repo
     and isn't on `main`, say so and stop (publish.md's branch rule).
   - **What goes in:** as publish.md step 3, except that `design/` always
     goes in (the plan is the point) and nothing about publishing (no Pages
     workflow, no `repo=`). `git init -b main` if it isn't a repo;
     `.gitignore` as in SKILL.md (always `.env`); `.gitattributes` from
     `${CLAUDE_SKILL_DIR}/templates/gitattributes`.
   - **The record:** write "Repo: <account>/<name> (<public or private>)"
     in `design/STATUS.md` now, so it goes up too.
   - **The check:** stage only the game's own files, run publish.md step
     3.9's check on what's staged, and, if there are earlier commits, on
     `git log -p` too (pushing sends all of it). Commit.
5. **Make it:** `gh repo create <account>/<name> --private` (or
   `--public`) `--source . --remote origin --push` (`github` if `origin` is
   taken).
6. **Report** the repo's address, whether it's public, that running
   `--repo` again sends later work up, and that `/gamegen --publish` puts
   the game online from it later. With `GAMEGEN_PLANS`, add or update its
   card (plans.md).

A private repo stays private: publishing asks before making it public, as
it does for any private repo.
