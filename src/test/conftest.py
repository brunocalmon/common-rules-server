import subprocess
from pathlib import Path

import pytest

from common_rules_server.service.config_service import ConfigService
from common_rules_server.service.resource_service import ResourceService

BUILT_IN_DIR = Path(__file__).resolve().parents[1] / "common_rules_server" / "resources"


@pytest.fixture
def project(tmp_path: Path) -> Path:
    """An empty project directory that is a real git repository."""
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    subprocess.run(
        ["git", "-C", str(tmp_path), "config", "user.email", "test@example.com"], check=True
    )
    subprocess.run(["git", "-C", str(tmp_path), "config", "user.name", "Test"], check=True)
    return tmp_path


@pytest.fixture
def python_project(project: Path) -> Path:
    (project / "pyproject.toml").write_text('[project]\nname = "demo"\n', encoding="utf-8")
    return project


@pytest.fixture
def config(python_project: Path) -> ConfigService:
    return ConfigService(str(python_project))


@pytest.fixture
def resources(config: ConfigService) -> ResourceService:
    """Resource service over the real built-in kit, rooted in a temp project."""
    return ResourceService(config)


@pytest.fixture
def isolated_resources(config: ConfigService, tmp_path: Path) -> ResourceService:
    """Resource service over an empty built-in directory, for parser-level tests."""
    built_in = tmp_path / "builtin"
    built_in.mkdir()
    return ResourceService(config, built_in_dir=str(built_in))


def write_resource(directory: Path, name: str, content: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{name}.md"
    path.write_text(content, encoding="utf-8")
    return path
