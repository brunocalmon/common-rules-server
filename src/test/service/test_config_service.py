import pytest
import os
from pathlib import Path
from common_rules_server.service.config_service import ConfigService

def test_config_service_defaults(tmp_path):
    service = ConfigService(project_root=str(tmp_path))
    result = service.get_config()
    
    config = service.get_config()["config"]
    assert config["README_PATH"] == "README.md"
    assert config["WIKI_DIR"] == ".docs"
    assert config["DOCS_PROTOCOL"] == ".docs/template/DOCUMENTATION-PROTOCOL.md"
    assert config["BUILD_COMMAND"] == ""
    assert result["env_status"]["file_exists"] is False

def test_config_service_auto_detect_python(tmp_path):
    (tmp_path / "pyproject.toml").touch()
    service = ConfigService(project_root=str(tmp_path))
    result = service.get_config()
    
    config = result["config"]
    assert config["BUILD_SYSTEM"] == "python"
    assert config["PROJECT_LANGUAGE"] == "python"
    assert result["env_status"]["auto_detected"]["BUILD_SYSTEM"] == "python"

def test_config_service_env_file_override(tmp_path):
    env_file = tmp_path / ".common-rules-mcp.env"
    env_file.write_text("README_PATH=docs/README.md\nCOVERAGE_THRESHOLD=90\n")
    
    service = ConfigService(project_root=str(tmp_path))
    result = service.get_config()
    
    config = result["config"]
    assert config["README_PATH"] == "docs/README.md"
    assert config["COVERAGE_THRESHOLD"] == "90"
    assert result["env_status"]["file_exists"] is True
