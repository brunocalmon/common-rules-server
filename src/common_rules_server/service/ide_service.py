import os
from pathlib import Path
from typing import Dict, Any

class IdeService:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())
        
    def setup_ide_rules(self) -> Dict[str, Any]:
        """Detects IDE and injects the global rule for the MCP."""
        results = {
            "cursor": False,
            "windsurf": False,
            "antigravity": False
        }
        
        rule_content = """# Common Rules Orchestrator
This project uses the `common-rules` MCP server for dynamic orchestration.
You MUST use the tools from this MCP server to guide your workflows.

## Mandatory Tools
1. Always start your session by running the `get_context` tool to understand the available resources, rules, and skills.
2. Read the resources provided, especially the `general` rule and `orchestrator` rule.
3. Utilize `code-review-graph` for deep repository context and `context-mode` for memory and context indexing.

## Behavior
Do NOT invent your own workflows if a workflow exists in the common-rules resources.
Follow the rules exactly as specified by the MCP.
"""

        # Check for Cursor
        cursor_dir = self.project_root / ".cursor"
        if cursor_dir.exists():
            rules_dir = cursor_dir / "rules"
            rules_dir.mkdir(parents=True, exist_ok=True)
            rule_file = rules_dir / "common-rules-orchestrator.mdc"
            
            cursor_content = f"""---
description: Global orchestrator rules for Cursor using the Common Rules MCP
globs: *
---
{rule_content}"""
            with open(rule_file, "w") as f:
                f.write(cursor_content)
            results["cursor"] = True
            
        # Check for Windsurf
        windsurf_dir = self.project_root / ".windsurf"
        if windsurf_dir.exists():
            rule_file = self.project_root / ".windsurfrules"
            
            # Append if exists, otherwise create
            if rule_file.exists():
                with open(rule_file, "r") as f:
                    content = f.read()
                if "Common Rules Orchestrator" not in content:
                    with open(rule_file, "a") as f:
                        f.write(f"\n\n{rule_content}")
            else:
                with open(rule_file, "w") as f:
                    f.write(rule_content)
            results["windsurf"] = True
            
        # Check for Antigravity (Gemini)
        gemini_dir = self.project_root / ".gemini"
        if gemini_dir.exists():
            config_dir = gemini_dir / "config"
            config_dir.mkdir(parents=True, exist_ok=True)
            rule_file = config_dir / "AGENTS.md"
            
            if rule_file.exists():
                with open(rule_file, "r") as f:
                    content = f.read()
                if "Common Rules Orchestrator" not in content:
                    with open(rule_file, "a") as f:
                        f.write(f"\n\n{rule_content}")
            else:
                with open(rule_file, "w") as f:
                    f.write(rule_content)
            results["antigravity"] = True
            
        return results
