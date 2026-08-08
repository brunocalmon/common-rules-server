import os
import stat
from pathlib import Path
from typing import Dict, Any

class GitHookService:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())
        
    def setup_hooks(self, config: Dict[str, str]) -> Dict[str, Any]:
        """Installs or updates git hooks based on configuration."""
        results = {
            "commit_msg_hook_installed": False,
            "error": None
        }
        
        strip_ai_coauthors = str(config.get("STRIP_AI_COAUTHORS", "false")).lower() == "true"
        
        git_dir = self.project_root / ".git"
        if not git_dir.exists() or not git_dir.is_dir():
            results["error"] = "Not a git repository"
            return results
            
        hooks_dir = git_dir / "hooks"
        hooks_dir.mkdir(exist_ok=True)
        
        commit_msg_file = hooks_dir / "commit-msg"
        
        if strip_ai_coauthors:
            hook_script = """#!/bin/sh
# Common Rules MCP: Strip AI Co-Authors
# Automatically removes 'Co-authored-by:' tags added by IDE AI agents.
grep -v "^Co-authored-by:" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
"""
            try:
                # Always overwrite to ensure it's our latest version
                # In a real app we might append, but for simplicity we'll overwrite or inject.
                # Actually, appending is safer. Let's read and append or create.
                if commit_msg_file.exists():
                    content = commit_msg_file.read_text(encoding="utf-8")
                    if "Common Rules MCP: Strip AI Co-Authors" not in content:
                        with open(commit_msg_file, "a", encoding="utf-8") as f:
                            f.write(f"\n{hook_script}")
                else:
                    with open(commit_msg_file, "w", encoding="utf-8") as f:
                        f.write(hook_script)
                        
                # Make executable
                st = os.stat(commit_msg_file)
                os.chmod(commit_msg_file, st.st_mode | stat.S_IEXEC)
                results["commit_msg_hook_installed"] = True
            except Exception as e:
                results["error"] = str(e)
                
        return results
