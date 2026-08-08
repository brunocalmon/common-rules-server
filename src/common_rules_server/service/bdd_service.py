import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

SCENARIO_PATTERN = re.compile(
    r"^\s*Scenario:\s*(.+?)$",
    re.MULTILINE,
)


class BddService:
    """Parses a Gherkin .feature file and paginates scenarios one at a time."""

    def __init__(self, project_root: str = None):
        from pathlib import Path
        import os

        self.project_root = Path(project_root) if project_root else Path(os.getcwd())

    def _find_feature_file(self) -> Optional[Path]:
        """Locate agent_bdd.feature in the project root."""
        path = self.project_root / "agent_bdd.feature"
        if path.exists():
            return path
        return None

    def _parse_scenarios(self, text: str) -> List[Dict[str, Any]]:
        """Split a .feature file into individual scenario blocks."""
        scenarios: List[Dict[str, Any]] = []

        # Find all Scenario: lines and their positions
        matches = list(SCENARIO_PATTERN.finditer(text))

        if not matches:
            return scenarios

        for i, match in enumerate(matches):
            name = match.group(1).strip()
            start = match.start()

            # End is either the start of the next Scenario or end of file
            if i + 1 < len(matches):
                end = matches[i + 1].start()
            else:
                end = len(text)

            body = text[start:end].strip()

            scenarios.append({
                "name": name,
                "body": body,
            })

        return scenarios

    def get_scenario(self, page: int = 1) -> Dict[str, Any]:
        """
        Returns a single scenario by page number (1-indexed).

        Returns:
            {
                "scenario": { "name": "...", "body": "..." },
                "page": 1,
                "total_pages": N,
                "has_next": true/false
            }
        """
        feature_file = self._find_feature_file()
        if not feature_file:
            return {
                "error": "agent_bdd.feature not found in project root.",
                "page": page,
                "total_pages": 0,
                "has_next": False,
            }

        text = feature_file.read_text(encoding="utf-8")
        scenarios = self._parse_scenarios(text)
        total = len(scenarios)

        if total == 0:
            return {
                "error": "No scenarios found in agent_bdd.feature.",
                "page": page,
                "total_pages": 0,
                "has_next": False,
            }

        if page < 1 or page > total:
            return {
                "error": f"Page {page} is out of range. Valid range: 1-{total}.",
                "page": page,
                "total_pages": total,
                "has_next": False,
            }

        scenario = scenarios[page - 1]

        return {
            "scenario": scenario,
            "page": page,
            "total_pages": total,
            "has_next": page < total,
        }
