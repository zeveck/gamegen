"""Claude Code's status line in the container: devcontainer-plus's, yours, or none.

    python3 statusline.py setup    at build time: add ours only if no status
                                   line is set (and it wasn't turned off), then
                                   say which is in use
    python3 statusline.py switch   from yours (or none) to ours, saving yours;
                                   from ours back to yours, or off if you had
                                   none (off stays off across rebuilds)

Run from the project folder (it copies .devcontainer/statusline.sh). `dc
statusline` runs it in the container for you.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys

CONFIG = os.environ.get("CLAUDE_CONFIG_DIR") or os.path.expanduser("~/.claude")
SETTINGS = os.path.join(CONFIG, "settings.json")
MARK = os.path.join(CONFIG, ".statusline.sh.installed")  # fingerprint of our installed copy
SAVED = os.path.join(CONFIG, ".statusline.yours.json")   # your status line, while ours is on
OFF = os.path.join(CONFIG, ".statusline.off")            # turned off on purpose
SOURCE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "statusline.sh")
HOME = os.path.expanduser("~")


def digest(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def read_settings():
    try:
        with open(SETTINGS) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def write_settings(settings):
    os.makedirs(CONFIG, exist_ok=True)
    with open(SETTINGS + ".tmp", "w") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")
    os.replace(SETTINGS + ".tmp", SETTINGS)


def our_path():
    """Where our script lives: ~/.claude/statusline.sh, unless that's yours."""
    plain = os.path.join(CONFIG, "statusline.sh")
    ours = os.path.exists(MARK) and os.path.exists(plain) and open(MARK).read().strip() == digest(plain)
    return plain if ours or not os.path.exists(plain) else os.path.join(CONFIG, "dcp-statusline.sh")


def install():
    """Copy our script in (refreshing our own copy), and return the command that runs it."""
    path = our_path()
    os.makedirs(CONFIG, exist_ok=True)
    shutil.copyfile(SOURCE, path)
    os.chmod(path, 0o755)
    if path.endswith("/statusline.sh"):
        with open(MARK, "w") as f:
            f.write(digest(path) + "\n")
    return "bash " + path


def in_use(settings):
    """'ours', 'yours' or None."""
    line = settings.get("statusLine")
    if not line:
        return None
    command = line.get("command", "") if isinstance(line, dict) else ""
    ours = {"bash " + os.path.join(CONFIG, "statusline.sh"), "bash " + os.path.join(CONFIG, "dcp-statusline.sh")}
    if command in ours and (command.endswith("dcp-statusline.sh") or our_path().endswith("/statusline.sh")):
        return "ours"
    return "yours"


def preview():
    """What ours looks like, drawn by the real script from sample numbers."""
    sample = {"model": {"display_name": "Opus"}, "context_window": {"used_percentage": 34},
              "rate_limits": {"five_hour": {"used_percentage": 12}, "seven_day": {"used_percentage": 61}}}
    try:
        r = subprocess.run(["bash", SOURCE], input=json.dumps(sample), capture_output=True, text=True, timeout=5)
        return r.stdout.strip() if r.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def show(settings):
    which = in_use(settings)
    if which == "ours":
        print("   Status line on: model, context used, and your 5-hour and 7-day limits.")
    elif which == "yours":
        print("   Keeping your own status line. devcontainer-plus's looks like this:")
        sample = preview()
        if sample:
            print(f"     {sample}")
        print("   (To try it: dcp statusline. Running it again goes back to yours.)")
    elif os.path.exists(OFF):
        print("   Status line off. (dcp statusline turns it on.)")
    else:
        print("   No status line.")


def main(mode):
    settings = read_settings()
    if mode == "setup":
        # Only ever add one: never replace yours, or one turned off on purpose.
        if not settings.get("statusLine") and not os.path.exists(OFF):
            settings["statusLine"] = {"type": "command", "command": install()}
            write_settings(settings)
        elif in_use(settings) == "ours":
            settings["statusLine"]["command"] = install()  # refresh our copy
            write_settings(settings)
        show(settings)
    elif mode == "switch":
        if in_use(settings) != "ours":
            if in_use(settings) == "yours":
                with open(SAVED, "w") as f:
                    json.dump(settings["statusLine"], f)
            settings["statusLine"] = {"type": "command", "command": install()}
            write_settings(settings)
            if os.path.exists(OFF):
                os.remove(OFF)
            back = "Yours is saved; run dcp statusline again to switch back." if os.path.exists(SAVED) \
                else "Run dcp statusline again to turn it off."
            print(f"Switched to devcontainer-plus's status line. {back} Restart Claude to see it.")
        elif os.path.exists(SAVED):
            with open(SAVED) as f:
                settings["statusLine"] = json.load(f)
            os.remove(SAVED)
            write_settings(settings)
            print("Your own status line is back. Restart Claude to see it. (dcp statusline switches again.)")
        else:
            settings.pop("statusLine", None)
            write_settings(settings)
            open(OFF, "w").close()
            print("Status line off, and it stays off when you rebuild. (dcp statusline turns it back on.)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "")
