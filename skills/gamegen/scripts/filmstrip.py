"""Lays out the frames first-load.sh filmed as one picture, and says when the
picture changed. Usage: filmstrip.py <playwright-cli output> <filmstrip.png>
"""
import base64
import io
import json
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

COLUMNS, WIDTH, MOST = 5, 320, 20


def frames_from(path):
    text = open(path, encoding="utf-8").read()
    if "### Result" not in text:
        sys.exit("first-load: playwright-cli didn't return frames:\n" + text[:2000])
    body = text.split("### Result", 1)[1].split("\n### ", 1)[0].strip()
    frames = json.loads(body)
    if isinstance(frames, str):  # some versions print the result as a JSON string
        frames = json.loads(frames)
    for f in frames:
        f["image"] = Image.open(io.BytesIO(base64.b64decode(f.pop("data")))).convert("RGB")
    return frames


def changed(a, b):
    """How much two frames differ, from 0 (the same) to 255."""
    small = (160, max(1, round(160 * a.height / a.width)))
    diff = ImageChops.difference(a.resize(small), b.resize(small))
    return max(ImageStat.Stat(diff).mean)


def main(raw, out):
    frames = frames_from(raw)
    if not frames:
        sys.exit("first-load: no frames were taken")

    # When the picture changed, frame to frame.
    changes = [f for prev, f in zip(frames, frames[1:]) if changed(prev["image"], f["image"]) > 2]
    fonts_at = next((f["t"] for f in frames if f["fonts"] == "loaded"), None)

    # Up to MOST frames for the picture: every change, then evenly spaced.
    picked = {0, len(frames) - 1} | {frames.index(f) for f in changes} | {frames.index(f) - 1 for f in changes}
    if len(picked) > MOST:
        keep = sorted(picked)
        picked = {keep[round(i * (len(keep) - 1) / (MOST - 1))] for i in range(MOST)}
    else:
        step = max(1, len(frames) // MOST)
        for i in range(0, len(frames), step):
            if len(picked) >= MOST:
                break
            picked.add(i)
    shown = [frames[i] for i in sorted(picked)]

    first = shown[0]["image"]
    height = round(WIDTH * first.height / first.width)
    rows = (len(shown) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGB", (COLUMNS * (WIDTH + 8) + 8, rows * (height + 30) + 8), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.load_default(size=16)
    except TypeError:  # Pillow before 10.1 has one small default font
        font = ImageFont.load_default()
    for i, f in enumerate(shown):
        x, y = 8 + (i % COLUMNS) * (WIDTH + 8), 8 + (i // COLUMNS) * (height + 30)
        sheet.paste(f["image"].resize((WIDTH, height)), (x, y))
        label = f"{f['t'] / 1000:.1f}s" + ("" if f["fonts"] == "loaded" else "  fonts loading")
        draw.text((x, y + height + 6), label, fill="black", font=font)
    sheet.save(out)

    print(f"filmstrip: {out} ({len(shown)} of {len(frames)} frames, {frames[-1]['t'] / 1000:.1f}s)")
    print("fonts loaded: " + (f"{fonts_at / 1000:.1f}s" if fonts_at is not None else "not by the end"))
    print("picture changed at: " + (", ".join(f"{f['t'] / 1000:.1f}s" for f in changes) or "never"))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
