#!/usr/bin/env python3
"""Small static-app checks used locally and in GitHub Actions."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def fail(message: str) -> None:
    print(f"❌ {message}")
    raise SystemExit(1)


def main() -> None:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if not SEMVER.fullmatch(version):
        fail("VERSION must use semantic versioning, such as 1.2.3")

    data = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    if data.get("version") != version:
        fail("version.json and VERSION do not match")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if f'data-app-version="{version}">v{version}' not in html:
        fail("index.html app version badge does not match VERSION")

    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    if f"etd-quest-v{version}" not in worker:
        fail("service-worker cache version does not match VERSION")

    for required in ["index.html", "manifest.webmanifest", "service-worker.js", "README.md"]:
        if not (ROOT / required).exists():
            fail(f"Required file is missing: {required}")

    print(f"✅ Validation passed — v{version}")


if __name__ == "__main__":
    main()
