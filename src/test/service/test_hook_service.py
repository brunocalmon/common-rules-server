"""Native editor hooks.

The generated scripts are executed as real subprocesses. Asserting on their text
would prove they were written; running them proves they enforce anything.
"""

import json
import subprocess
from pathlib import Path

import pytest

from common_rules_server.service.hook_service import MANAGED_MARKER, HookService

HOOK = {
    "name": "test-guard",
    "description": "Blocks a marker command.",
    "event": "before-shell",
    "blocking": True,
    "script": (
        'case "$HOOK_INPUT" in\n'
        '  *forbidden*) decision=deny; message="Not allowed here." ;;\n'
        '  *risky*) decision=ask; message="Are you sure about this?" ;;\n'
        "esac"
    ),
}


def run(script: Path, payload: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["sh", str(script)], input=payload, capture_output=True, text=True, timeout=20
    )


# ----------------------------------------------------------------- wiring


def test_installs_config_and_scripts_for_every_editor(tmp_path: Path):
    result = HookService(str(tmp_path)).install([HOOK])

    assert {entry["ide"] for entry in result["installed"]} == {"cursor", "claude", "antigravity"}
    assert (tmp_path / ".cursor/hooks.json").exists()
    assert (tmp_path / ".claude/settings.json").exists()
    assert (tmp_path / ".agents/hooks.json").exists()
    for ide_dir in (".cursor/hooks", ".claude/hooks", ".agents/hooks"):
        assert (tmp_path / ide_dir / "test-guard.sh").exists()


def test_each_editor_gets_its_documented_config_shape(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK])

    cursor = json.loads((tmp_path / ".cursor/hooks.json").read_text())
    assert cursor["version"] == 1
    assert cursor["hooks"]["beforeShellExecution"][0]["command"].endswith("test-guard.sh")
    assert cursor["hooks"]["beforeShellExecution"][0]["failClosed"] is True

    claude = json.loads((tmp_path / ".claude/settings.json").read_text())
    group = claude["hooks"]["PreToolUse"][0]
    assert group["matcher"] == "Bash"
    assert group["hooks"][0]["type"] == "command"
    assert "${CLAUDE_PROJECT_DIR}" in group["hooks"][0]["command"]

    antigravity = json.loads((tmp_path / ".agents/hooks.json").read_text())
    assert "test-guard" in antigravity
    assert antigravity["test-guard"]["PreToolUse"][0]["matcher"] == "run_command"


def test_unsupported_event_is_reported_not_silently_dropped(tmp_path: Path):
    """Antigravity has no prompt-submit event; that gap must be visible."""
    hook = {**HOOK, "name": "prompt-check", "event": "before-prompt"}
    result = HookService(str(tmp_path)).install([hook])

    gaps = [g for g in result["unsupported"] if g["ide"] == "antigravity"]
    assert gaps and gaps[0]["hook"] == "prompt-check"
    assert not (tmp_path / ".agents/hooks/prompt-check.sh").exists()
    assert (tmp_path / ".cursor/hooks/prompt-check.sh").exists()


def test_scripts_are_executable(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK])
    import os, stat
    for ide_dir in (".cursor/hooks", ".claude/hooks", ".agents/hooks"):
        path = tmp_path / ide_dir / "test-guard.sh"
        assert os.stat(path).st_mode & stat.S_IXUSR


def test_existing_hand_written_hooks_are_preserved(tmp_path: Path):
    config = tmp_path / ".cursor" / "hooks.json"
    config.parent.mkdir(parents=True)
    config.write_text(json.dumps({
        "version": 1,
        "hooks": {"afterFileEdit": [{"command": "./my-own-formatter.sh"}]},
    }))

    HookService(str(tmp_path)).install([HOOK], ["cursor"])

    written = json.loads(config.read_text())
    assert written["hooks"]["afterFileEdit"][0]["command"] == "./my-own-formatter.sh"
    assert "beforeShellExecution" in written["hooks"]


def test_claude_settings_keeps_unrelated_keys(tmp_path: Path):
    """settings.json holds far more than hooks; the rest must survive."""
    settings = tmp_path / ".claude" / "settings.json"
    settings.parent.mkdir(parents=True)
    settings.write_text(json.dumps({"theme": "dark", "enableWorkflows": True}))

    HookService(str(tmp_path)).install([HOOK], ["claude"])

    written = json.loads(settings.read_text())
    assert written["theme"] == "dark"
    assert written["enableWorkflows"] is True
    assert "PreToolUse" in written["hooks"]


def test_reinstall_does_not_duplicate(tmp_path: Path):
    service = HookService(str(tmp_path))
    service.install([HOOK], ["cursor"])
    service.install([HOOK], ["cursor"])

    cursor = json.loads((tmp_path / ".cursor/hooks.json").read_text())
    assert len(cursor["hooks"]["beforeShellExecution"]) == 1


def test_uninstall_removes_only_generated_hooks(tmp_path: Path):
    config = tmp_path / ".cursor" / "hooks.json"
    config.parent.mkdir(parents=True)
    config.write_text(json.dumps({
        "version": 1, "hooks": {"afterFileEdit": [{"command": "./mine.sh"}]},
    }))
    service = HookService(str(tmp_path))
    service.install([HOOK], ["cursor"])
    service.uninstall(["cursor"])

    written = json.loads(config.read_text())
    assert written["hooks"]["afterFileEdit"][0]["command"] == "./mine.sh"
    assert "beforeShellExecution" not in written["hooks"]
    assert not (tmp_path / ".cursor/hooks/test-guard.sh").exists()


# --------------------------------------------------------------- behaviour


def test_cursor_deny_uses_its_permission_contract(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK], ["cursor"])
    result = run(tmp_path / ".cursor/hooks/test-guard.sh", '{"command":"forbidden thing"}')

    assert result.returncode == 0
    payload = json.loads(result.stdout)
    assert payload["permission"] == "deny"
    assert payload["user_message"] == "Not allowed here."


def test_cursor_ask_uses_its_permission_contract(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK], ["cursor"])
    payload = json.loads(
        run(tmp_path / ".cursor/hooks/test-guard.sh", '{"command":"risky thing"}').stdout
    )
    assert payload["permission"] == "ask"


def test_claude_deny_blocks_with_exit_two(tmp_path: Path):
    """Claude documents exit 2 as the blocking code, with stderr fed back."""
    HookService(str(tmp_path)).install([HOOK], ["claude"])
    result = run(tmp_path / ".claude/hooks/test-guard.sh", '{"command":"forbidden"}')

    assert result.returncode == 2
    assert "Not allowed here." in result.stderr


def test_claude_ask_returns_a_permission_decision(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK], ["claude"])
    result = run(tmp_path / ".claude/hooks/test-guard.sh", '{"command":"risky"}')

    assert result.returncode == 0
    decision = json.loads(result.stdout)["hookSpecificOutput"]
    assert decision["hookEventName"] == "PreToolUse"
    assert decision["permissionDecision"] == "ask"


def test_ordinary_input_is_allowed_everywhere(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK])
    for ide_dir in (".cursor/hooks", ".claude/hooks", ".agents/hooks"):
        result = run(tmp_path / ide_dir / "test-guard.sh", '{"command":"ls -la"}')
        assert result.returncode == 0, ide_dir


def test_session_context_is_injected_as_claude_expects(tmp_path: Path):
    hook = {
        "name": "briefing",
        "description": "Injects context.",
        "event": "session-start",
        "blocking": False,
        "script": 'decision=allow\nmessage="Read the contract first."',
    }
    HookService(str(tmp_path)).install([hook], ["claude"])
    result = run(tmp_path / ".claude/hooks/briefing.sh", "{}")

    payload = json.loads(result.stdout)["hookSpecificOutput"]
    assert payload["hookEventName"] == "SessionStart"
    assert payload["additionalContext"] == "Read the contract first."


def test_quotes_in_a_message_cannot_break_the_json(tmp_path: Path):
    hook = {
        **HOOK,
        "name": "quoter",
        "script": 'decision=deny; message="he said \\"stop\\" now"',
    }
    HookService(str(tmp_path)).install([hook], ["cursor"])
    result = run(tmp_path / ".cursor/hooks/quoter.sh", "{}")
    json.loads(result.stdout)  # must parse


def test_scripts_carry_the_managed_marker(tmp_path: Path):
    HookService(str(tmp_path)).install([HOOK], ["cursor"])
    assert MANAGED_MARKER in (tmp_path / ".cursor/hooks/test-guard.sh").read_text()


def test_hook_command_is_extracted_from_each_editors_payload(tmp_path: Path):
    """Editors nest the command differently but all spell the field the same."""
    hook = {
        "name": "echoer",
        "description": "Reports the extracted command.",
        "event": "before-shell",
        "blocking": False,
        "script": 'decision=allow; message="saw:$HOOK_COMMAND"',
    }
    HookService(str(tmp_path)).install([hook], ["cursor"])
    script = tmp_path / ".cursor/hooks/echoer.sh"

    for payload in (
        '{"command":"ls -la"}',
        '{"tool_input":{"command":"ls -la"},"tool_name":"Bash"}',
        '{"tool_name":"Bash","tool_input":{"command":"ls -la","description":"list"}}',
    ):
        message = json.loads(run(script, payload).stdout)["agent_message"]
        assert message == "saw:ls -la", payload


def test_the_shipped_hooks_all_run(tmp_path: Path, resources):
    """Every hook in the default kit must execute without error."""
    hooks = resources.hooks()
    assert len(hooks) >= 6
    HookService(str(tmp_path)).install(hooks, ["cursor"])

    for hook in hooks:
        script = tmp_path / ".cursor/hooks" / f"{hook['name']}.sh"
        result = run(script, '{"command":"echo hello"}')
        assert result.returncode == 0, f"{hook['name']}: {result.stderr}"
        assert json.loads(result.stdout)["permission"] in ("allow", "ask", "deny")


@pytest.mark.parametrize(
    "command,expected",
    [
        # Genuine hazards.
        ("cat .env", "deny"),
        ("cat .env.local", "deny"),
        ("head -5 config/id_rsa", "deny"),
        ("printenv", "deny"),
        ("env | sort", "deny"),
        ("rm -rf /", "deny"),
        ("rm -rf build", "ask"),
        ("rm -fr node_modules", "ask"),
        ("git push --force origin main", "ask"),
        ("git push -f origin main", "ask"),
        ("git reset --hard HEAD~3", "ask"),
        ("git clean -fd", "ask"),
        ("git checkout .", "ask"),
        ('psql -c "DROP TABLE users"', "ask"),
        # Ordinary work. Every one of these was flagged by an earlier version
        # that matched substrings anywhere in the payload. A guard that trips on
        # normal commands gets switched off, and then guards nothing — so these
        # matter as much as the hazards above.
        ("ls -la", "allow"),
        ("cat README.md", "allow"),
        ("cat notes.environment", "allow"),
        ("npm run env-check", "allow"),
        ("rm file.txt", "allow"),
        ("git push origin main", "allow"),
        ("git commit -m 'feat: thing'", "allow"),
        ("git commit -m 'document printenv usage'", "allow"),
        ("git commit -m 'remove rm -rf from the docs'", "allow"),
        ('git commit -m "document git push --force"', "allow"),
        ('echo "drop table is a sql statement"', "allow"),
    ],
)
def test_shipped_guards_make_the_right_call(tmp_path, resources, command, expected):
    HookService(str(tmp_path)).install(resources.hooks(), ["cursor"])
    verdicts = set()
    for name in ("guard-secrets", "guard-destructive", "protect-authorship"):
        script = tmp_path / ".cursor/hooks" / f"{name}.sh"
        payload = json.dumps({"command": command})
        verdicts.add(json.loads(run(script, payload).stdout)["permission"])

    if expected == "allow":
        assert verdicts == {"allow"}, f"{command} was not allowed: {verdicts}"
    else:
        assert expected in verdicts, f"{command} expected {expected}, got {verdicts}"


def test_ai_co_author_commit_is_blocked_before_it_runs(tmp_path, resources):
    HookService(str(tmp_path)).install(resources.hooks(), ["cursor"])
    script = tmp_path / ".cursor/hooks/protect-authorship.sh"

    blocked = json.dumps(
        {"command": 'git commit -m "feat: x\n\nCo-authored-by: Claude <noreply@anthropic.com>"'}
    )
    assert json.loads(run(script, blocked).stdout)["permission"] == "deny"

    human = json.dumps(
        {"command": 'git commit -m "feat: x\n\nCo-authored-by: Ana <ana@example.com>"'}
    )
    assert json.loads(run(script, human).stdout)["permission"] == "allow"
