"""Commit authorship protection.

The behavioural tests here run the generated hook as a real subprocess against a
real commit message file. Asserting on the script's text would only prove it was
written; running it proves it filters.
"""

import os
import stat
import subprocess
from pathlib import Path

import pytest

from common_rules_server.service.git_hook_service import MARKER, GitHookService


def _run_hook(hook: Path, message: str, tmp_path: Path) -> str:
    msg_file = tmp_path / "COMMIT_EDITMSG"
    msg_file.write_text(message, encoding="utf-8")
    result = subprocess.run(
        ["sh", str(hook), str(msg_file)], capture_output=True, text=True, timeout=20
    )
    assert result.returncode == 0, result.stderr
    return msg_file.read_text(encoding="utf-8")


@pytest.fixture
def installed_hook(project: Path) -> Path:
    service = GitHookService(str(project))
    result = service.setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    assert result["installed"] is True
    return Path(result["hook_path"])


# ---------------------------------------------------------------- installing


def test_installs_an_executable_hook(project: Path):
    result = GitHookService(str(project)).setup_hooks({"STRIP_AI_COAUTHORS": "true"})

    assert result["installed"] is True
    assert result["action"] == "installed"
    hook = Path(result["hook_path"])
    assert hook.exists()
    assert os.stat(hook).st_mode & stat.S_IXUSR
    assert MARKER in hook.read_text(encoding="utf-8")


def test_reinstalling_is_idempotent(project: Path):
    service = GitHookService(str(project))
    service.setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    second = service.setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    assert second["action"] == "unchanged"
    assert second["installed"] is True


def test_disabled_setting_installs_nothing(project: Path):
    result = GitHookService(str(project)).setup_hooks({"STRIP_AI_COAUTHORS": "false"})
    assert result["installed"] is False
    assert result["action"] == "disabled"
    assert not (project / ".git" / "hooks" / "commit-msg").exists()


def test_turning_it_off_removes_a_previously_installed_hook(project: Path):
    service = GitHookService(str(project))
    service.setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    result = service.setup_hooks({"STRIP_AI_COAUTHORS": "false"})
    assert result["action"] == "uninstalled"
    assert not Path(result["hook_path"]).exists()


def test_outside_a_repository_it_reports_rather_than_failing(tmp_path: Path):
    result = GitHookService(str(tmp_path)).setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    assert result["installed"] is False
    assert result["action"] == "skipped"


def test_an_existing_foreign_hook_is_preserved_and_chained(project: Path):
    """Someone else's hook may be the project's commit-message linter."""
    hooks = project / ".git" / "hooks"
    hooks.mkdir(parents=True, exist_ok=True)
    original = hooks / "commit-msg"
    original.write_text("#!/bin/sh\n# project linter\nexit 0\n", encoding="utf-8")

    result = GitHookService(str(project)).setup_hooks({"STRIP_AI_COAUTHORS": "true"})

    assert result["action"] == "chained"
    backup = hooks / "commit-msg.pre-common-rules"
    assert backup.exists()
    assert "# project linter" in backup.read_text(encoding="utf-8")
    assert "commit-msg.pre-common-rules" in original.read_text(encoding="utf-8")


def test_a_chained_hook_that_rejects_blocks_the_commit(project: Path):
    hooks = project / ".git" / "hooks"
    hooks.mkdir(parents=True, exist_ok=True)
    (hooks / "commit-msg").write_text("#!/bin/sh\nexit 1\n", encoding="utf-8")

    result = GitHookService(str(project)).setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    assert result["action"] == "chained"

    msg_file = project / "MSG"
    msg_file.write_text("feat: something\n", encoding="utf-8")
    completed = subprocess.run(
        ["sh", str(hooks / "commit-msg"), str(msg_file)], capture_output=True, text=True
    )
    assert completed.returncode == 1


def test_worktree_git_file_is_resolved(tmp_path: Path):
    """In a worktree, .git is a file pointing at the real git directory."""
    real_git = tmp_path / "real.git"
    (real_git / "hooks").mkdir(parents=True)
    worktree = tmp_path / "worktree"
    worktree.mkdir()
    (worktree / ".git").write_text(f"gitdir: {real_git}\n", encoding="utf-8")

    hooks_dir = GitHookService(str(worktree)).hooks_dir()
    assert hooks_dir == real_git / "hooks"


# ----------------------------------------------------------------- filtering


def test_ai_co_author_trailer_is_removed(installed_hook: Path, tmp_path: Path):
    result = _run_hook(
        installed_hook,
        "feat: add pagination\n\nCo-authored-by: Claude <noreply@anthropic.com>\n",
        tmp_path,
    )
    assert "feat: add pagination" in result
    assert "Co-authored-by:" not in result


def test_human_co_author_trailer_is_preserved(installed_hook: Path, tmp_path: Path):
    """A human co-author trailer is a true statement about who wrote the code."""
    result = _run_hook(
        installed_hook,
        "fix: off-by-one\n\n"
        "Co-authored-by: Ana Pereira <ana@example.com>\n"
        "Co-authored-by: Cursor <noreply@cursor.sh>\n",
        tmp_path,
    )
    assert "Co-authored-by: Ana Pereira <ana@example.com>" in result
    assert "cursor.sh" not in result


@pytest.mark.parametrize(
    "trailer",
    [
        "Co-authored-by: Claude <noreply@anthropic.com>",
        "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>",
        "co-authored-by: GitHub Copilot <copilot@github.com>",
        "Co-authored-by: Gemini <gemini@google.com>",
        "Co-authored-by: Antigravity <bot@antigravity.dev>",
        "Co-authored-by: Devin <devin@cognition.ai>",
        "🤖 Generated with Claude Code",
        "Generated with Cursor",
    ],
)
def test_known_ai_trailers_are_all_removed(installed_hook, tmp_path, trailer):
    result = _run_hook(installed_hook, f"chore: work\n\n{trailer}\n", tmp_path)
    assert "chore: work" in result
    assert trailer not in result


def test_an_ordinary_message_is_untouched(installed_hook: Path, tmp_path: Path):
    message = (
        "feat: add the thing\n"
        "\n"
        "Longer explanation across\n"
        "several lines.\n"
        "\n"
        "Refs: #123\n"
        "Signed-off-by: Bruno Calmon <bruno@example.com>\n"
    )
    assert _run_hook(installed_hook, message, tmp_path).rstrip("\n") == message.rstrip("\n")


def test_no_temporary_file_is_left_behind(installed_hook: Path, tmp_path: Path):
    """The failing case: a message consisting only of a stripped trailer.

    Filtering leaves no output, so a conditional move would silently abandon the
    temp file in the git directory on every such commit.
    """
    _run_hook(installed_hook, "Co-authored-by: Claude <noreply@anthropic.com>\n", tmp_path)
    assert list(tmp_path.glob("*.common-rules.*")) == []


def test_hook_succeeds_on_an_empty_message(installed_hook: Path, tmp_path: Path):
    assert _run_hook(installed_hook, "", tmp_path) == ""


def test_end_to_end_through_a_real_commit(project: Path):
    """The whole point: git itself applies the filter."""
    GitHookService(str(project)).setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    (project / "file.txt").write_text("content\n", encoding="utf-8")
    subprocess.run(["git", "-C", str(project), "add", "."], check=True)
    subprocess.run(
        [
            "git",
            "-C",
            str(project),
            "commit",
            "-m",
            "feat: real commit\n\nCo-authored-by: Claude <noreply@anthropic.com>",
        ],
        check=True,
        capture_output=True,
    )

    message = subprocess.run(
        ["git", "-C", str(project), "log", "-1", "--pretty=%B"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    assert "feat: real commit" in message
    assert "Co-authored-by:" not in message


# ------------------------------------------------------------------- preview


def test_pure_python_mirror_matches_the_hook_behaviour():
    stripped = GitHookService.strip_trailers(
        "feat: x\n\nCo-authored-by: Claude <noreply@anthropic.com>\n"
        "Co-authored-by: Ana <ana@example.com>\n"
    )
    assert "Ana" in stripped
    assert "anthropic" not in stripped
