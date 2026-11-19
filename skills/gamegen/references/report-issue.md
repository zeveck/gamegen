# Reporting a problem with gamegen (`--report-issue`)

`--report-issue <what happened>` files an issue about gamegen itself, in
zeveck/gamegen, for something that went wrong or could work better in a run.
It changes nothing in the game and costs nothing.

1. **Gather what a reader needs,** from this conversation and the game's
   `design/STATUS.md`: what happened, what was expected, and the evidence
   (the steps, the file and line, the message printed, a screenshot only if
   the game's repo is public, by its address there). Add gamegen's version
   (`${CLAUDE_SKILL_DIR}/../.claude-plugin/plugin.json`), the request and flags of the run, the target
   (web, 3D, an engine). If there's no game here, leave out the game details
   and use only this conversation. Never anything private: no `.env` values
   or keys, no names or emails (not even the credit name in STATUS.md), only
   paths relative to the game folder, and the request in your own words, not
   quoted. Name the game's repo or link its files only if `gh repo view
   --json visibility` says `PUBLIC`; otherwise don't name the game.
2. **Look for it first:** `gh issue list -R zeveck/gamegen --state all
   --search "<a few words>"`. If an issue already covers it, say so and offer
   to add a comment there instead (the same rules: it stands on its own, is
   shown first, and holds nothing private).
3. **Write it to stand on its own:** a plain title, then what happened, the
   evidence, what was expected, and a short proposal in plain words. Never
   point to work that only exists on this machine (a local branch, a
   scratch file). If a fix is already drafted, offer to open it as a pull
   request that says which issue it fixes (from a fork, if they can't push
   to zeveck/gamegen), once the issue is filed.
4. **Show it to the person and ask before filing,** even with
   `--no-confirm`: it's public. Write the body to a temporary file outside
   the game folder, then `gh issue create -R zeveck/gamegen --title …
   --body-file …`, and give them its link. If `gh auth status` fails, give
   them the finished text and https://github.com/zeveck/gamegen/issues/new
   to paste it into.
