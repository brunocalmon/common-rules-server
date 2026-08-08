"""Checks that belong to the repository rather than to any one module.

Each of these was a manual audit step that found a real defect. Run by hand they
find a problem once; run in CI they keep it fixed.
"""

import ast
import re
import tomllib
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
PACKAGE = ROOT / "src" / "common_rules_server"
DOCS = ROOT / ".docs"

PYTHON_FILES = sorted(PACKAGE.rglob("*.py")) + sorted((ROOT / "src" / "test").rglob("*.py"))
#: Imported material under history/ keeps links into the context it came from.
#: It is preserved as a record, not maintained as navigation.
MARKDOWN_FILES = [
    p for p in sorted(DOCS.rglob("*.md")) if "history" not in p.relative_to(DOCS).parts
] + [ROOT / "README.md"]

LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
EXTERNAL = ("http://", "https://", "file://", "#", "mailto:")


def _minimum_python() -> tuple[int, int]:
    spec = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["requires-python"]
    major, minor = re.search(r"(\d+)\.(\d+)", spec).groups()
    return int(major), int(minor)


@pytest.mark.parametrize("path", PYTHON_FILES, ids=lambda p: str(p.relative_to(ROOT)))
def test_parses_under_the_oldest_supported_python(path: Path):
    """A backslash in an f-string expression is a syntax error before 3.12.

    It runs fine locally and in CI on a newer interpreter, so nothing catches it
    until someone on the declared minimum tries to import the package.
    """
    try:
        ast.parse(path.read_text(encoding="utf-8"), feature_version=_minimum_python())
    except SyntaxError as exc:
        pytest.fail(f"{path.relative_to(ROOT)} is not valid on Python "
                    f"{'.'.join(map(str, _minimum_python()))}: {exc.msg}")


@pytest.mark.parametrize("path", MARKDOWN_FILES, ids=lambda p: str(p.relative_to(ROOT)))
def test_every_relative_link_resolves(path: Path):
    """Navigation is the wiki's main affordance; a dead link removes it."""
    broken = []
    for target in LINK.findall(path.read_text(encoding="utf-8")):
        if target.startswith(EXTERNAL):
            continue
        if not (path.parent / target.split("#")[0]).exists():
            broken.append(target)
    assert not broken, f"{path.relative_to(ROOT)} links to: {broken}"


def test_the_wiki_generators_are_in_the_repository():
    """They were in a temp directory once; nobody could rebuild the wiki."""
    for name in ("wikigen.py", "build_template.py", "build_project_wiki.py"):
        assert (ROOT / "tools" / "wiki" / name).is_file(), f"missing generator: {name}"


def test_hand_written_wiki_content_is_preserved_by_the_generator():
    """The generator wiped a directory it did not own and deleted 3,541 lines."""
    script = (ROOT / "tools" / "wiki" / "build_project_wiki.py").read_text()
    assert "PRESERVE" in script
    for directory in (DOCS / "claude").iterdir():
        if directory.is_dir() and not (directory / "README.md").exists():
            continue
    assert (DOCS / "claude" / "history").is_dir()
    assert "history" in re.search(r"PRESERVE = \{([^}]*)\}", script).group(1)


def test_no_generated_output_is_committed_to_the_repository_root():
    """Sync writes into .cursor, .claude and .agents; those are per-project."""
    from common_rules_server.service.sync_service import GENERATED_HEADER

    for path in ROOT.rglob("*.md"):
        if ".venv" in path.parts or ".git" in path.parts:
            continue
        assert GENERATED_HEADER not in path.read_text(encoding="utf-8", errors="replace"), (
            f"{path.relative_to(ROOT)} is generated output and should not be committed here"
        )


def test_readme_resource_counts_match_the_kit(resources):
    """Documented numbers drift silently; the README is the first thing read."""
    readme = (ROOT / "README.md").read_text()
    catalogue = resources.load()

    total = len(catalogue["resources"]) + len(catalogue["gated_out"])
    stated = int(re.search(r"(\d+) resources", readme).group(1))
    assert stated == total, f"README says {stated} resources; the kit has {total}"

    templates = len(list((PACKAGE / "resources" / "templates").glob("*.md")))
    stated_templates = int(re.search(r"(\d+)\s*\n?output\s*\n?templates", readme).group(1))
    assert stated_templates == templates


def test_pyproject_declares_the_package_data_needed_at_runtime():
    """The kit is markdown; a wheel without it ships a server with no resources."""
    config = tomllib.loads((ROOT / "pyproject.toml").read_text())
    packages = config["tool"]["hatch"]["build"]["targets"]["wheel"]["packages"]
    assert "src/common_rules_server" in packages
