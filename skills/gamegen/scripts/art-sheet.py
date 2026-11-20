#!/usr/bin/env python3
"""Build a game's art sheet: a page showing all its art and audio.

    python3 art-sheet.py <manifest.json>

Run from the project folder. The manifest (written by the skill) says what
goes in each section; this script makes web-sized copies of every picture,
builds animations from frames, copies the audio and the font, and writes
index.html, all next to the manifest (usually .gamegen/art-sheet/). It never
changes the game's own files. Paths in the manifest are relative to the
project folder.

Manifest:
{
  "title": "Bloom Hop: The Art",
  "intro": "Everything made for the game: ...",
  "font": "game/fonts/Fredoka.woff2",                       (optional)
  "colors": {"bg": "#16241c", "text": "#f3ead8", "accent": "#e0a030"},
  "hero": {"file": "game/assets/title.png", "alt": "..."},  (optional)
  "sections": [
    {"title": "The cast", "lede": "...", "kind": "cards",
     "items": [{"file": "...", "name": "Fern", "caption": "You", "alt": "...",
                "mark": true}]},
    kinds: "cards" (portraits), "gallery" (pictures), "wide" (scenes, model
    sheets), "audio" (items: file, name, caption), "colors" (items: color,
    name). In cards, gallery and wide, an item can give "frames": [files]
    and "ms" (per frame) instead of "file", to show an animation.
  ],
  "links": {                                                 (optional)
    "base": "https://bloomhop.example.com/", "strip": "game/",
    "pictures": "link", "audio": "players"
  }
}

With "links", files are linked where the game already serves them instead
of copied: a file's address is base + its path without "strip" (files
elsewhere are copied). "pictures": "link" or "copy" (web-sized copies, for
a game nobody can reach yet); "audio": "players" (on the page) or "links"
(a link to each sound, for a private repo: only people with access can
open them). Animations made from frames are always built here.
"""
import html
import json
import urllib.parse
import os
import re
import shutil
import sys

SIZES = {"cards": 512, "gallery": 720, "wide": 1400, "hero": 1400}
HEX = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")
MAX_FILES, MAX_BYTES = 256, 60_000_000  # per publish: the artifact tools' limits, with room


def colour(value, default):
    """A #rgb or #rrggbb colour, as #rrggbb; anything else gives the default."""
    if not isinstance(value, str) or not HEX.match(value):
        return default
    if len(value) == 4:
        value = "#" + "".join(ch * 2 for ch in value[1:])
    return value.lower()


def fail(msg):
    sys.exit(f"art-sheet: {msg}")


def main():
    if len(sys.argv) != 2:
        fail("usage: art-sheet.py <manifest.json>")
    try:
        from PIL import Image
    except ImportError:
        fail("needs Pillow (pip install Pillow)")
    manifest_path = sys.argv[1]
    try:
        with open(manifest_path) as f:
            m = json.load(f)
    except (OSError, ValueError) as e:
        fail(f"can't read {manifest_path}: {e}")
    out = os.path.dirname(os.path.abspath(manifest_path))
    # It clears img/, audio/ and fonts/ next to the manifest, so it only ever
    # works in a .gamegen folder, never in the game's own.
    if "/.gamegen/" not in out.replace(os.sep, "/") + "/":
        fail(f"the manifest must be in a .gamegen folder (such as .gamegen/art-sheet/), not {out}")
    for sub in ("img", "audio", "fonts"):
        shutil.rmtree(os.path.join(out, sub), ignore_errors=True)
        os.makedirs(os.path.join(out, sub))

    missing, unreadable, used = [], [], set()
    links = m.get("links") or {}
    base = str(links.get("base", "")).rstrip("/")
    strip = str(links.get("strip", "")).replace("\\", "/").strip("/")
    strip = strip + "/" if strip else ""
    if base and not base.startswith("https://"):
        fail(f"links.base must be an https:// address, not {base}")

    def linked(src):
        """The address a file is served at, or None to copy it."""
        if not base or os.path.isabs(src):
            return None
        rel = os.path.relpath(src).replace(os.sep, "/")
        if rel.startswith("../") or not rel.startswith(strip):
            return None
        return base + "/" + urllib.parse.quote(rel[len(strip):])

    def name_for(src, ext):
        base = re.sub(r"[^a-z0-9_-]+", "-", os.path.splitext(os.path.basename(src))[0].lower()).strip("-") or "file"
        n, i = base, 2
        while f"{n}{ext}" in used:
            n, i = f"{base}-{i}", i + 1
        used.add(f"{n}{ext}")
        return f"{n}{ext}"

    def picture(src, size):
        if not src or not os.path.isfile(src):
            missing.append(src or "(an item with no file)")
            return None, 0, 0
        url = linked(src) if links.get("pictures") == "link" else None
        if url and src.lower().endswith(".svg"):
            return url, size, size
        if src.lower().endswith(".svg"):  # copied as it is
            dest = name_for(src, ".svg")
            shutil.copyfile(src, os.path.join(out, "img", dest))
            return f"img/{dest}", size, size
        try:
            im = Image.open(src)
        except Exception:
            unreadable.append(src)
            return None, 0, 0
        if url:  # shown at the same size a copy would be
            w, h = im.size
            k = min(1, size / max(w, h))
            return url, round(w * k), round(h * k)
        if getattr(im, "is_animated", False):  # keep animations as they are
            dest = name_for(src, os.path.splitext(src)[1].lower())
            shutil.copyfile(src, os.path.join(out, "img", dest))
            return f"img/{dest}", im.width, im.height
        im.thumbnail((size, size))
        alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        if alpha:
            dest = name_for(src, ".png")
            im.convert("RGBA").save(os.path.join(out, "img", dest), optimize=True)
        else:
            dest = name_for(src, ".jpg")
            im.convert("RGB").save(os.path.join(out, "img", dest), quality=85, optimize=True)
        return f"img/{dest}", im.width, im.height

    def animation(frames, ms, size):
        ok = [f for f in frames if os.path.isfile(f) or missing.append(f)]
        if not ok:
            return None, 0, 0
        ims = []
        for f in ok:
            try:
                im = Image.open(f).convert("RGBA")
            except Exception:
                unreadable.append(f)
                return None, 0, 0
            im.thumbnail((size, size))
            ims.append(im)
        dest = name_for(ok[0], ".gif")
        ims[0].save(os.path.join(out, "img", dest), save_all=True, append_images=ims[1:],
                    duration=int(ms), loop=0, disposal=2)
        return f"img/{dest}", ims[0].width, ims[0].height

    e = html.escape
    c = m.get("colors", {})
    bg, fg, accent = colour(c.get("bg"), "#15171c"), colour(c.get("text"), "#f2efe8"), colour(c.get("accent"), "#e0a030")
    font_css, family = "", "system-ui, sans-serif"
    if m.get("font"):
        if os.path.isfile(m["font"]):
            dest = name_for(m["font"], os.path.splitext(m["font"])[1].lower())
            shutil.copyfile(m["font"], os.path.join(out, "fonts", dest))
            font_css = f"@font-face{{font-family:Game;src:url(fonts/{dest})}}"
            family = "Game, " + family
        else:
            missing.append(m["font"])

    body, nav = [], []
    hero = m.get("hero")
    if hero:
        src, w, h = picture(hero.get("file", ""), SIZES["hero"])
        if src:
            body.append(f'<header class="hero"><img src="{e(src)}" alt="{e(hero.get("alt", ""))}" width="{w}" height="{h}">')
        else:
            body.append('<header class="hero">')
    else:
        body.append('<header class="hero">')
    body.append(f'<div><h1>{e(m.get("title", "The Art"))}</h1><p>{e(m.get("intro", ""))}</p></div></header>')

    sections = []
    for i, s in enumerate(m.get("sections", [])):
        sid = f"s{i + 1}"
        nav.append(f'<a href="#{sid}">{e(s.get("title", ""))}</a>')
        kind = s.get("kind", "gallery")
        parts = [f'<section id="{sid}"><h2>{e(s.get("title", ""))}</h2>']
        if s.get("lede"):
            parts.append(f'<p class="lede">{e(s["lede"])}</p>')
        if kind == "colors":
            parts.append('<div class="swatches">')
            for it in s.get("items", []):
                hexv = colour(it.get("color"), None)
                if not hexv:
                    continue  # only real colours, never CSS
                parts.append(f'<figure><div style="background:{hexv}"></div><figcaption><b>{e(it.get("name", ""))}</b><span>{hexv}</span></figcaption></figure>')
        elif kind == "audio":
            note = len(parts)
            parts.append('<div class="tracks">')
            for it in s.get("items", []):
                f = it.get("file", "")
                if not os.path.isfile(f):
                    missing.append(f)
                    continue
                url = linked(f) if links.get("audio") in ("players", "links") else None
                if not url:
                    dest = name_for(f, os.path.splitext(f)[1].lower())
                    shutil.copyfile(f, os.path.join(out, "audio", dest))
                    url = f"audio/{dest}"
                head = f'<div class="track"><b>{e(it.get("name", ""))}</b><span>{e(it.get("caption", ""))}</span>'
                if links.get("audio") == "links" and not url.startswith("audio/"):
                    if note is not None:
                        parts.insert(note, '<p class="lede">These open for people with access to the game\'s repo.</p>')
                        note = None
                    parts.append(head + f'<a href="{e(url)}" target="_blank" rel="noopener">Listen ↗</a></div>')
                else:
                    parts.append(head + f'<audio controls preload="none" aria-label="{e(it.get("name", ""))}" src="{e(url)}"></audio></div>')
        else:
            size = SIZES.get(kind, SIZES["gallery"])
            parts.append(f'<div class="grid {kind}">')
            for it in s.get("items", []):
                if it.get("frames"):
                    src, w, h = animation(it["frames"], it.get("ms", 100), size)
                else:
                    src, w, h = picture(it.get("file", ""), size)
                if not src:
                    continue
                cap = f'<b>{e(it.get("name", ""))}</b>' + (f'<span>{e(it["caption"])}</span>' if it.get("caption") else "")
                mark = ' class="mark"' if it.get("mark") else ""
                alt = it.get("alt") or it.get("name", "")
                parts.append(f'<figure{mark}><img src="{e(src)}" alt="{e(alt)}" width="{w}" height="{h}" loading="lazy"><figcaption>{cap}</figcaption></figure>')
        parts.append("</div></section>")
        sections.append("".join(parts))

    problems = []
    if missing:
        problems.append("these files don't exist:\n  " + "\n  ".join(dict.fromkeys(missing)))
    if unreadable:
        problems.append("these can't be read as pictures:\n  " + "\n  ".join(dict.fromkeys(unreadable)))
    if problems:
        fail("\n".join(problems))

    css = f"""{font_css}
*{{box-sizing:border-box}}body{{margin:0;background:{bg};color:{fg};font:16px/1.5 {family}}}
img{{max-width:100%;height:auto;display:block}}a{{color:{accent}}}
.hero{{position:relative}}.hero img{{width:100%;height:auto}}
.hero div{{padding:24px 5vw}}h1{{margin:0 0 8px;font-size:clamp(28px,5vw,48px)}}
nav{{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;gap:6px 18px;padding:10px 5vw;background:{bg}ee;border-bottom:1px solid {accent}55}}
main{{padding:0 5vw 64px}}section{{padding-top:32px;scroll-margin-top:48px}}h2{{color:{accent};margin:0 0 6px}}.lede{{opacity:.8;margin:0 0 16px;max-width:70ch}}
.grid{{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(var(--w),1fr))}}
.cards{{--w:180px}}.gallery{{--w:240px}}.wide{{--w:420px}}
figure{{margin:0;background:#ffffff0d;border-radius:10px;overflow:hidden}}figure.mark{{outline:3px solid {accent}}}
figcaption{{padding:8px 10px}}figcaption b,figcaption span{{display:block}}figcaption span{{opacity:.85;font-size:14px}}
.swatches{{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}}.swatches div{{height:72px}}
.tracks{{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}}
.track{{background:#ffffff0d;border-radius:10px;padding:12px}}.track b,.track span{{display:block}}.track span{{opacity:.85;font-size:14px}}.track audio{{width:100%;margin-top:8px}}
a:focus-visible,audio:focus-visible{{outline:3px solid {accent};outline-offset:3px}}"""
    page = (f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{e(m.get("title", "The Art"))}</title><style>{css}</style></head><body>'
            + "".join(body) + f'<nav aria-label="Sections">{"".join(nav)}</nav><main>'
            + "".join(sections) + "</main></body></html>")
    with open(os.path.join(out, "index.html"), "w") as f:
        f.write(page)

    files = sorted(os.path.relpath(os.path.join(d, n), out) for d, _, ns in os.walk(out) for n in ns
                   if not n.endswith(".json"))
    files.remove("index.html")
    files.insert(0, "index.html")
    total = sum(os.path.getsize(os.path.join(out, f)) for f in files)
    print(f"art sheet: {out}/index.html, {len(files)} files, {total / 1e6:.1f} MB")
    # Batches that fit one publish each, index.html in the first.
    batches, cur, size = [], [], 0
    for f in files:
        b = os.path.getsize(os.path.join(out, f))
        if cur and (len(cur) >= MAX_FILES or size + b > MAX_BYTES):
            batches.append(cur)
            cur, size = [], 0
        cur.append(f)
        size += b
    batches.append(cur)
    with open(os.path.join(out, "batches.json"), "w") as f:
        json.dump(batches, f, indent=1)
    if len(batches) > 1:
        print(f"art sheet: {len(batches)} batches to publish, listed in {out}/batches.json")


if __name__ == "__main__":
    main()
