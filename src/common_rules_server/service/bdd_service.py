"""Paginated Gherkin reader for agent-executed acceptance tests.

The feature file describes how the system behaves from the outside, and the
agent executes it by actually calling the tools and comparing what comes back
against what the scenario says should come back. No test runner is involved.

Scenarios are served one per page for a specific reason: an agent handed the
whole file will skim it and report success in aggregate. Handed one scenario, it
has to carry out that scenario's steps and state what it observed before it can
ask for the next one.

Each page is self-contained. The feature's name, its description and its
``Background`` travel with every scenario, because a scenario read in isolation
without its background is not executable.
"""

import os
import re
from pathlib import Path
from typing import Any, Optional

# A line that opens a scenario. `Examples:` is excluded on purpose -- it is the
# data table belonging to a Scenario Outline, not a new scenario.
SCENARIO_KEYWORDS = ("Scenario Outline", "Scenario Template", "Scenario", "Example")
SCENARIO_RE = re.compile(
    r"^[ \t]*(?P<keyword>Scenario Outline|Scenario Template|Scenario|Example)[ \t]*:[ \t]*(?P<name>.*)$"
)
FEATURE_RE = re.compile(r"^[ \t]*Feature[ \t]*:[ \t]*(?P<name>.*)$")
BACKGROUND_RE = re.compile(r"^[ \t]*Background[ \t]*:[ \t]*(?P<name>.*)$")
RULE_RE = re.compile(r"^[ \t]*Rule[ \t]*:[ \t]*(?P<name>.*)$")
TAG_RE = re.compile(r"^[ \t]*@\S")


class BddService:
    def __init__(self, project_root: Optional[str] = None, feature_path: Optional[str] = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())
        self.feature_path = feature_path

    # ------------------------------------------------------------ locating

    def find_feature_file(self) -> Optional[Path]:
        """Finds the feature file, preferring an explicitly configured path."""
        candidates = []
        if self.feature_path:
            configured = Path(self.feature_path)
            candidates.append(
                configured if configured.is_absolute() else self.project_root / configured
            )
        candidates.append(self.project_root / "agent_bdd.feature")

        for candidate in candidates:
            if candidate.is_file():
                return candidate

        # Last resort: a single .feature file anywhere obvious in the project.
        for directory in (self.project_root, self.project_root / "features", self.project_root / "tests"):
            if directory.is_dir():
                found = sorted(directory.glob("*.feature"))
                if len(found) == 1:
                    return found[0]
        return None

    # ------------------------------------------------------------- parsing

    def parse(self, text: str) -> dict[str, Any]:
        """Splits a feature file into its header, background and scenarios."""
        lines = text.splitlines()

        feature_name = ""
        feature_description: list[str] = []
        background: Optional[dict] = None
        scenarios: list[dict] = []

        feature_line = None
        for index, line in enumerate(lines):
            match = FEATURE_RE.match(line)
            if match:
                feature_name = match.group("name").strip()
                feature_line = index
                break

        # Boundaries: every line that opens a scenario or a background block.
        boundaries: list[tuple[int, str]] = []
        for index, line in enumerate(lines):
            if SCENARIO_RE.match(line):
                boundaries.append((index, "scenario"))
            elif BACKGROUND_RE.match(line):
                boundaries.append((index, "background"))

        # Description: everything between `Feature:` and the first block, minus
        # any `Rule:` headings, which structure the file but are not prose.
        if feature_line is not None:
            end = boundaries[0][0] if boundaries else len(lines)
            for line in lines[feature_line + 1 : end]:
                if line.strip() and not RULE_RE.match(line) and not TAG_RE.match(line):
                    feature_description.append(line.rstrip())

        # Tag lines sit above the header they belong to, so each block starts at
        # its first tag rather than at its keyword. Resolving every start first
        # matters: a block must end where the *next* block's tags begin, not at
        # the next keyword, or each scenario swallows the following one's tags.
        starts = []
        for start, kind in boundaries:
            block_start = start
            while block_start > 0 and TAG_RE.match(lines[block_start - 1]):
                block_start -= 1
            starts.append((block_start, start, kind))

        for position, (block_start, start, kind) in enumerate(starts):
            end = starts[position + 1][0] if position + 1 < len(starts) else len(lines)

            body = "\n".join(lines[block_start:end]).rstrip()
            tags = [
                tag
                for line in lines[block_start:start]
                for tag in line.split()
                if tag.startswith("@")
            ]

            if kind == "background":
                background = {"body": body, "line": start + 1}
                continue

            match = SCENARIO_RE.match(lines[start])
            scenarios.append(
                {
                    "name": match.group("name").strip(),
                    "keyword": match.group("keyword").strip(),
                    "tags": tags,
                    "body": body,
                    "line": start + 1,
                }
            )

        return {
            "feature": feature_name,
            "description": "\n".join(feature_description).strip(),
            "background": background,
            "scenarios": scenarios,
        }

    # ---------------------------------------------------------------- pages

    def get_scenario(self, page: int = 1) -> dict[str, Any]:
        """Returns one scenario, with everything needed to execute it alone."""
        try:
            page = int(page)
        except (TypeError, ValueError):
            return _error(f"Page must be a whole number, received {page!r}.", page, 0)

        feature_file = self.find_feature_file()
        if feature_file is None:
            return _error(
                "No feature file found. Expected agent_bdd.feature in the project "
                "root, or BDD_FILE_PATH set in .common-rules-server/config.env.",
                page,
                0,
            )

        try:
            text = feature_file.read_text(encoding="utf-8")
        except OSError as exc:
            return _error(f"Could not read {feature_file}: {exc}", page, 0)

        parsed = self.parse(text)
        scenarios = parsed["scenarios"]
        total = len(scenarios)

        if total == 0:
            return _error(f"No scenarios found in {feature_file.name}.", page, 0)

        if page < 1 or page > total:
            return _error(
                f"Page {page} is out of range. This feature has {total} scenarios "
                f"(valid pages 1-{total}).",
                page,
                total,
            )

        scenario = scenarios[page - 1]

        return {
            "feature": parsed["feature"],
            "feature_description": parsed["description"],
            "feature_file": str(feature_file),
            "background": (parsed["background"] or {}).get("body"),
            "scenario": {
                "name": scenario["name"],
                "keyword": scenario["keyword"],
                "tags": scenario["tags"],
                "body": scenario["body"],
                "line": scenario["line"],
            },
            "page": page,
            "total_pages": total,
            "has_next": page < total,
            "next_page": page + 1 if page < total else None,
            "instruction": (
                "Execute this scenario for real: perform the Given/When steps by "
                "calling the actual tools, then check each Then against what came "
                "back. Report the observed value, not the expected one. "
                + (
                    f"When finished, call get_bdd_scenario(page={page + 1})."
                    if page < total
                    else "This is the last scenario; summarise all results when done."
                )
            ),
        }

    def summary(self) -> dict[str, Any]:
        """Feature-level overview without paging through it."""
        feature_file = self.find_feature_file()
        if feature_file is None:
            return {"error": "No feature file found.", "total_scenarios": 0}

        parsed = self.parse(feature_file.read_text(encoding="utf-8"))
        return {
            "feature": parsed["feature"],
            "feature_file": str(feature_file),
            "has_background": parsed["background"] is not None,
            "total_scenarios": len(parsed["scenarios"]),
            "scenarios": [
                {"page": index + 1, "name": s["name"], "keyword": s["keyword"], "tags": s["tags"]}
                for index, s in enumerate(parsed["scenarios"])
            ],
        }


def _error(message: str, page: int, total: int) -> dict[str, Any]:
    return {
        "error": message,
        "page": page,
        "total_pages": total,
        "has_next": False,
        "next_page": None,
    }
