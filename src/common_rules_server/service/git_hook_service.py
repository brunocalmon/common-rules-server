"""Commit authorship protection.

AI coding agents append trailers to commit messages — ``Co-authored-by:`` lines
and "generated with" footers. On GitHub a co-author trailer attributes the
commit to that identity, which is a claim on authorship the repository owner
never agreed to.

This installs a ``commit-msg`` hook that removes those trailers. It removes only
the ones that name a known AI agent: a human pair-programming trailer is a real
statement about who wrote the code and is left alone.

The hook is installed rather than the behaviour being asked of the agent,
because a hook applies to every commit from every tool, including the ones that
add the trailer without mentioning it.
"""

import os
import re
import stat
import subprocess
from pathlib import Path
from typing import Any, Optional

MARKER = "common-rules:strip-ai-trailers"
BACKUP_SUFFIX = ".pre-common-rules"

# Identities that indicate a machine author rather than a person.
#
# Every alternative is delimited by a non-alphanumeric character or a string
# boundary, and short tokens are spelled out in full. Both rules exist because
# an unbounded short token matches inside ordinary words: `amp` alone matches
# "ex-amp-le", which stripped the credit of any human co-author with an
# example.com address. Erasing a real person's authorship is the worst thing
# this filter could do, so it errs towards leaving a trailer in place.
_AI_IDENTITIES = (
    "claude|anthropic|cursor|copilot|codeium|windsurf|antigravity|gemini|"
    "google-labs-jules|openai|chatgpt|codex|devin|aider|sourcegraph|"
    "cody|ampcode|zed industries|bot"
)
AI_IDENTITY_PATTERN = f"(^|[^a-z0-9])({_AI_IDENTITIES})([^a-z0-9]|$)"

HOOK_TEMPLATE = """#!/bin/sh
# {marker}
#
# Removes commit-message trailers injected by AI coding agents so that commit
# authorship reflects the person who owns the work. Trailers naming a human
# co-author are preserved.
#
# Managed by the common-rules MCP server. Delete this file to opt out, or set
# STRIP_AI_COAUTHORS=false in .common-rules-server/config.env and re-run setup.

MSG_FILE="$1"
[ -n "$MSG_FILE" ] && [ -f "$MSG_FILE" ] || exit 0
{chain}
AI_PATTERN='{ai_pattern}'
TMP_FILE="$MSG_FILE.common-rules.$$"

# Two passes: co-author trailers naming an AI identity, then "generated with"
# style advertising footers. Written to a temp file and moved unconditionally --
# a conditional move would leave the temp file behind when every line is
# filtered out.
grep -viE "^[[:space:]]*co-authored-by:.*$AI_PATTERN" "$MSG_FILE" 2>/dev/null \\
  | grep -viE "^[[:space:]]*.{{0,4}}(generated with|created with|co-created with|written by).*$AI_PATTERN" 2>/dev/null \\
  > "$TMP_FILE"

mv -f "$TMP_FILE" "$MSG_FILE" 2>/dev/null
exit 0
"""

CHAIN_TEMPLATE = """
# A commit-msg hook was already present when this one was installed. It runs
# first and keeps its power to reject the commit.
PRIOR_HOOK="$(dirname "$0")/{backup_name}"
if [ -x "$PRIOR_HOOK" ]; then
  "$PRIOR_HOOK" "$@" || exit $?
fi
"""


class GitHookService:
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())

    # ------------------------------------------------------------ discovery

    def hooks_dir(self) -> Optional[Path]:
        """Locates the hooks directory the way git itself would.

        ``git rev-parse --git-path hooks`` is authoritative: it accounts for
        worktrees (where ``.git`` is a file), submodules, and a ``core.hooksPath``
        override. The manual fallback only covers the ordinary case, for when git
        is not on PATH.
        """
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--git-path", "hooks"],
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            if result.returncode == 0 and result.stdout.strip():
                path = Path(result.stdout.strip())
                return path if path.is_absolute() else self.project_root / path
        except (OSError, subprocess.SubprocessError):
            pass

        git_path = self.project_root / ".git"
        if git_path.is_dir():
            return git_path / "hooks"
        if git_path.is_file():
            # Worktree or submodule: the file points at the real git directory.
            try:
                content = git_path.read_text(encoding="utf-8").strip()
            except OSError:
                return None
            match = re.match(r"gitdir:\s*(.+)", content)
            if match:
                target = Path(match.group(1).strip())
                if not target.is_absolute():
                    target = (self.project_root / target).resolve()
                return target / "hooks"
        return None

    # ------------------------------------------------------------- install

    def setup_hooks(self, config: dict) -> dict[str, Any]:
        enabled = str(config.get("STRIP_AI_COAUTHORS", "true")).strip().lower() in (
            "true",
            "1",
            "yes",
            "on",
        )

        result: dict[str, Any] = {
            "enabled": enabled,
            "installed": False,
            "action": "none",
            "hook_path": None,
            "notes": [],
        }

        hooks_dir = self.hooks_dir()
        if hooks_dir is None:
            result["action"] = "skipped"
            result["notes"].append("Not a git repository; no hook installed.")
            return result

        hook_path = hooks_dir / "commit-msg"
        result["hook_path"] = str(hook_path)

        if not enabled:
            if hook_path.exists() and MARKER in _safe_read(hook_path):
                self._uninstall(hook_path, result)
            else:
                result["action"] = "disabled"
                result["notes"].append(
                    "STRIP_AI_COAUTHORS is false; commit messages are left untouched."
                )
            return result

        try:
            hooks_dir.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            result["action"] = "failed"
            result["notes"].append(f"Could not create hooks directory: {exc}")
            return result

        chain = ""
        existing = _safe_read(hook_path) if hook_path.exists() else None

        if existing is not None and MARKER not in existing:
            # Someone else's hook. Preserve it and call it first rather than
            # overwrite it -- it may be the project's commit-message linter.
            backup = hook_path.with_name(hook_path.name + BACKUP_SUFFIX)
            if not backup.exists():
                try:
                    hook_path.replace(backup)
                    _make_executable(backup)
                except OSError as exc:
                    result["action"] = "failed"
                    result["notes"].append(f"Could not preserve existing hook: {exc}")
                    return result
            chain = CHAIN_TEMPLATE.format(backup_name=backup.name)
            result["action"] = "chained"
            result["notes"].append(
                f"An existing commit-msg hook was preserved as {backup.name} and still runs first."
            )
        elif existing is not None:
            result["action"] = "updated"
        else:
            result["action"] = "installed"

        script = HOOK_TEMPLATE.format(
            marker=MARKER, chain=chain, ai_pattern=AI_IDENTITY_PATTERN
        )

        if existing is not None and existing == script:
            result["installed"] = True
            result["action"] = "unchanged"
            return result

        try:
            hook_path.write_text(script, encoding="utf-8")
            _make_executable(hook_path)
        except OSError as exc:
            result["action"] = "failed"
            result["notes"].append(f"Could not write hook: {exc}")
            return result

        result["installed"] = True
        result["notes"].append(
            "AI co-author and 'generated with' trailers will be stripped from commit "
            "messages. Human co-author trailers are preserved."
        )
        return result

    def _uninstall(self, hook_path: Path, result: dict) -> None:
        backup = hook_path.with_name(hook_path.name + BACKUP_SUFFIX)
        try:
            hook_path.unlink()
            if backup.exists():
                backup.replace(hook_path)
                result["notes"].append("Restored the commit-msg hook that was there before.")
        except OSError as exc:
            result["action"] = "failed"
            result["notes"].append(f"Could not remove hook: {exc}")
            return
        result["action"] = "uninstalled"
        result["notes"].append("STRIP_AI_COAUTHORS is false; the hook was removed.")

    # -------------------------------------------------------------- preview

    @staticmethod
    def strip_trailers(message: str) -> str:
        """Pure-Python mirror of what the hook does, for tests and previews."""
        ai = re.compile(AI_IDENTITY_PATTERN, re.IGNORECASE)
        # Mirrors the hook's two grep passes; kept in lockstep with it by the
        # parametrised trailer tests, which exercise both paths.
        coauthor = re.compile(r"^\s*co-authored-by:", re.IGNORECASE)
        generated = re.compile(
            r"^\s*.{0,4}(generated with|created with|co-created with|written by)\s", re.IGNORECASE
        )

        kept = [
            line
            for line in message.splitlines()
            if not ((coauthor.match(line) or generated.match(line)) and ai.search(line))
        ]
        return "\n".join(kept)


def _safe_read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _make_executable(path: Path) -> None:
    mode = os.stat(path).st_mode
    os.chmod(path, mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
