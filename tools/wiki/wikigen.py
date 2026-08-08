"""Wiki generator.

Writes pages and derives every navigation link from one ordered spine, so
prev/next and breadcrumbs cannot drift out of sync with the files on disk.
"""

import os
import re
from pathlib import Path


def rel(from_path: Path, to_path: Path) -> str:
    return os.path.relpath(to_path, from_path.parent).replace(os.sep, "/")


def build(root: Path, pages: list[tuple[str, str, str]], hub: str = "README.md") -> None:
    """pages: ordered list of (relative_path, title, body)."""
    root.mkdir(parents=True, exist_ok=True)
    paths = [root / p for p, _, _ in pages]

    for index, (rel_path, title, body) in enumerate(pages):
        path = root / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)

        hub_link = rel(path, root / hub)
        header = "" if rel_path == hub else f"[← Wiki Hub]({hub_link})\n\n---\n\n"

        nav = []
        if index > 0:
            prev_path, prev_title, _ = pages[index - 1]
            nav.append(f"← Previous: [{prev_title}]({rel(path, root / prev_path)})")
        if index < len(pages) - 1:
            next_path, next_title, _ = pages[index + 1]
            nav.append(f"Next: [{next_title}]({rel(path, root / next_path)}) →")

        footer = ""
        if nav:
            footer = "\n\n---\n\n" + " · ".join(nav) + "\n"
        elif rel_path != hub:
            footer = "\n"

        path.write_text(f"{header}{body.strip()}\n{footer}", encoding="utf-8")

    return paths


LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def check_links(root: Path) -> list[str]:
    """Returns every relative link that does not resolve to a file."""
    broken = []
    for path in sorted(root.rglob("*.md")):
        for target in LINK.findall(path.read_text(encoding="utf-8")):
            # file:// links appear in imported transcripts and point outside
            # the wiki by nature; they are not navigation.
            if target.startswith(("http://", "https://", "file://", "#", "mailto:")):
                continue
            resolved = (path.parent / target.split("#")[0]).resolve()
            if not resolved.exists():
                broken.append(f"{path.relative_to(root.parent)} -> {target}")
    return broken
