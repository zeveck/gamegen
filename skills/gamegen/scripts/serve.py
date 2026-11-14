#!/usr/bin/env python3
"""Serve a game folder for play-testing, with caching off.

python3 -m http.server sends Last-Modified but no Cache-Control, so a
long-lived browser session can keep running old JavaScript after an edit
(heuristic caching). This serves the same files with Cache-Control: no-store,
on 127.0.0.1 only, never serves hidden files (such as .env), and never lists
a folder's contents.

Usage: python3 serve.py <port> <folder>
"""
import functools
import http.server
import os
import sys
import urllib.parse


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        # Decode first, as the file lookup does, so /%2eenv is caught too.
        path = urllib.parse.unquote(self.path.split("?", 1)[0].split("#", 1)[0])
        if any(part.startswith(".") for part in path.replace("\\", "/").split("/") if part):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):  # no folder listings: they'd name .env
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):  # quiet: a play-test makes many requests
        pass


def main():
    usage = "usage: serve.py <port> <folder>"
    if len(sys.argv) != 3:
        sys.exit(usage)
    try:
        port = int(sys.argv[1])
    except ValueError:
        sys.exit(f"serve.py: the port must be a number\n{usage}")
    folder = sys.argv[2]
    if not os.path.isdir(folder):
        sys.exit(f"serve.py: {folder} isn't a folder")
    handler = functools.partial(NoStoreHandler, directory=folder)
    try:
        httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    except OSError as e:
        sys.exit(f"serve.py: can't use port {port} ({e.strerror}); pick another")
    with httpd:
        print(f"serving {folder} at http://127.0.0.1:{httpd.server_address[1]}/ (no-store)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
