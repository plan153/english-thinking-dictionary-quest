#!/usr/bin/env python3
"""Bump semantic version and update every public version marker."""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"major", "minor", "patch"}:
        raise SystemExit("Usage: python3 scripts/bump_version.py {major|minor|patch}")

    kind = sys.argv[1]
    version_path = ROOT / "VERSION"
    old = version_path.read_text(encoding="utf-8").strip()
    match = SEMVER.fullmatch(old)
    if not match:
        raise SystemExit("VERSION must use semantic versioning, such as 1.2.3")

    major, minor, patch = map(int, match.groups())
    if kind == "major":
        major, minor, patch = major + 1, 0, 0
    elif kind == "minor":
        minor, patch = minor + 1, 0
    else:
        patch += 1
    new = f"{major}.{minor}.{patch}"

    version_path.write_text(new + "\n", encoding="utf-8")
    (ROOT / "version.json").write_text(
        json.dumps(
            {
                "version": new,
                "releasedAt": date.today().isoformat(),
                "name": "English Thinking Dictionary Quest",
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    html_path = ROOT / "index.html"
    html = html_path.read_text(encoding="utf-8")
    html, count = re.subn(
        r'data-app-version="[^"]+">v[^<]+',
        f'data-app-version="{new}">v{new}',
        html,
        count=1,
    )
    if count != 1:
        raise SystemExit("Could not find data-app-version marker in index.html")
    html_path.write_text(html, encoding="utf-8")

    worker_path = ROOT / "service-worker.js"
    worker = worker_path.read_text(encoding="utf-8")
    worker, count = re.subn(
        r"const CACHE = 'etd-quest-v[^']+';",
        f"const CACHE = 'etd-quest-v{new}';",
        worker,
        count=1,
    )
    if count != 1:
        raise SystemExit("Could not find cache marker in service-worker.js")
    worker_path.write_text(worker, encoding="utf-8")

    print(f"v{old} → v{new}")


if __name__ == "__main__":
    main()
