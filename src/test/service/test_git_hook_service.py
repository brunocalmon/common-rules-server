import pytest
import os
import stat
from pathlib import Path
from common_rules_server.service.git_hook_service import GitHookService

def test_git_hook_service_no_git_dir(tmp_path):
    service = GitHookService(project_root=str(tmp_path))
    result = service.setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    
    assert result["commit_msg_hook_installed"] is False
    assert result["error"] == "Not a git repository"

def test_git_hook_service_install_hook(tmp_path):
    # Mock a git repo
    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    
    service = GitHookService(project_root=str(tmp_path))
    result = service.setup_hooks({"STRIP_AI_COAUTHORS": "true"})
    
    assert result["commit_msg_hook_installed"] is True
    assert result["error"] is None
    
    hook_file = git_dir / "hooks" / "commit-msg"
    assert hook_file.exists()
    
    content = hook_file.read_text(encoding="utf-8")
    assert "Common Rules MCP: Strip AI Co-Authors" in content
    assert "grep -v" in content
    
    # Check if executable
    st = os.stat(hook_file)
    assert bool(st.st_mode & stat.S_IEXEC)

def test_git_hook_service_disabled(tmp_path):
    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    
    service = GitHookService(project_root=str(tmp_path))
    result = service.setup_hooks({"STRIP_AI_COAUTHORS": "false"})
    
    assert result["commit_msg_hook_installed"] is False
    assert not (git_dir / "hooks" / "commit-msg").exists()
