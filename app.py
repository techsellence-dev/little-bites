"""Hugging Face Space entry point (Gradio SDK, no Docker).

Little Bites is a Node.js app, but the Gradio SDK only runs Python. This file downloads a Node 22 binary
(node:sqlite needs >= 22.13), then replaces itself with `node server.js` listening on port 7860, which is
the port Spaces expose. Data lives in /tmp, so it is wiped whenever the Space restarts.
"""
import os
import pathlib
import shutil
import subprocess
import tarfile
import urllib.request

NODE_VERSION = "22.14.0"


def node_ok(path):
    try:
        out = subprocess.run([path, "-v"], capture_output=True, text=True, timeout=10).stdout.strip().lstrip("v")
        return tuple(int(x) for x in out.split(".")[:2]) >= (22, 13)
    except Exception:
        return False


def get_node():
    found = shutil.which("node")
    if found and node_ok(found):
        return found
    root = pathlib.Path("/tmp/node")
    binary = root / f"node-v{NODE_VERSION}-linux-x64" / "bin" / "node"
    if not binary.exists():
        root.mkdir(parents=True, exist_ok=True)
        url = f"https://nodejs.org/dist/v{NODE_VERSION}/node-v{NODE_VERSION}-linux-x64.tar.xz"
        archive = root / "node.tar.xz"
        print(f"[app.py] downloading {url}", flush=True)
        urllib.request.urlretrieve(url, archive)
        with tarfile.open(archive, "r:xz") as t:
            t.extractall(root)
        archive.unlink()
    return str(binary)


if __name__ == "__main__":
    node = get_node()
    env = dict(os.environ, PORT="7860", DATA_DIR="/tmp/littlebites-data", TRUST_PROXY="1")
    host = os.environ.get("SPACE_HOST")  # e.g. user-little-bites.hf.space
    if host and not env.get("APP_URL"):
        env["APP_URL"] = f"https://{host}"
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    os.execve(node, [node, "server.js"], env)
