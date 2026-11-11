# The setup check, in detail

SKILL.md says when to run the check and what must pass. This is what it
checks, and what to do when something's missing or refused.

## What it checks

`scripts/check-setup.sh` tests each API key with a free request (never
printing it), using the environment or the nearest `.env` file in the folder
`/gamegen` was run in or above it, and checks Python with Pillow and
`playwright-cli`. For a 3D game, `--3d` also checks the Meshy key
(meshgen).

- `OPENAI_API_KEY`: imagegen2, and anim8gen (which draws with imagegen2).
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`: nanogen.
- `ELEVENLABS_API_KEY`: audiogen. The check also reports the account's plan
  (`tier`); only the free plan's audio needs a credit (see asset-guide.md).

## When keys are missing or refused

First run

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/prepare-env.sh"
```

(with `--3d` for a 3D game, so the `.env` has a line for the Meshy key too).

It creates a `.env` with a line for each key and where to get it (or adds
lines for just the missing keys to an existing `.env`, leaving the rest
alone), and lists `.env` in the `.gitignore` beside it so keys never get
committed. Then tell them, for example: "I've made a `.env` file in this
folder for your keys, with links to where you get each one. Paste them in,
save, and run your `/gamegen` command again." When a key is refused, say it
looks wrong or expired, and where to get a new one (the links are in that
file).

## When a key isn't needed

Only when the person has said so:

- `--budget 0`, or a request like "draw the art in code": no image keys.
- "No music", "no sound", "silent": no ElevenLabs key. ("Make the sounds in
  code" means effects synthesized with Web Audio.)
- "Only use OpenAI" (or Gemini) for the art: that one image key.

Without `OPENAI_API_KEY` there's no anim8gen, so characters get a few drawn
poses or code animation. If Pillow is missing, install it
(`python3 -m pip install --user pillow`) and say so. If `playwright-cli` is
missing, play-testing uses the fallback in `references/playtest-guide.md`.

## The plugins

Confirm the four plugins' skills (`imagegen2`, `nanogen`, `anim8gen`,
`audiogen`), and `meshgen` for a 3D game, are available to you; they install
with gamegen. When the game goes in a new folder below the one with `.env`,
run the generators from the folder that has the `.env`, with output paths
pointing into the game folder.

## When a generator fails partway through

If a generator fails for a reason a retry won't fix (the key stops working,
credits run out), stop generating and tell the person what happened and how
to fix it, then pick up with `--continue` once they have. Don't swap in
code-drawn art unless they agree.
