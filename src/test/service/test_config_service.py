"""Configuration: explicit, explained, and never destructive."""

from pathlib import Path

from common_rules_server.service.config_service import CONFIG_SCHEMA, ConfigService


def test_write_creates_the_config_file(python_project: Path):
    service = ConfigService(str(python_project))
    assert not service.env_file.exists()

    service.write_config()

    assert service.env_file.exists()
    assert service.env_file.parent.name == ".common-rules-server"


def test_every_known_key_is_written_even_when_empty(python_project: Path):
    """A key absent from the file is a key the user cannot discover."""
    service = ConfigService(str(python_project))
    service.write_config()
    text = service.env_file.read_text(encoding="utf-8")

    for key in CONFIG_SCHEMA:
        assert f"\n{key.name}=" in f"\n{text}", f"{key.name} is missing from the file"


def test_every_key_is_preceded_by_an_explanation(python_project: Path):
    """The requirement is a file that teaches, not one that merely holds values."""
    service = ConfigService(str(python_project))
    service.write_config()
    lines = service.env_file.read_text(encoding="utf-8").splitlines()

    for index, line in enumerate(lines):
        if "=" not in line or line.startswith("#"):
            continue
        key = line.split("=", 1)[0]
        preceding = [l for l in lines[max(0, index - 6) : index] if l.startswith("#")]
        assert preceding, f"{key} has no explanatory comment above it"


def test_keys_without_a_safe_default_are_flagged_for_a_human(python_project: Path):
    service = ConfigService(str(python_project))
    resolved = service.write_config()

    assert "TEST_COMMAND" in resolved["env_status"]["needs_input"]
    assert resolved["config"]["TEST_COMMAND"] == ""
    assert "# NEEDS INPUT: no safe default." in service.env_file.read_text(encoding="utf-8")


def test_detects_build_system_from_project_files(python_project: Path):
    resolved = ConfigService(str(python_project)).get_config()
    assert resolved["env_status"]["auto_detected"]["BUILD_SYSTEM"] == "python"
    assert resolved["env_status"]["detection_evidence"]["BUILD_SYSTEM"] == "pyproject.toml"


def test_lockfile_wins_over_the_generic_manifest(project: Path):
    (project / "pyproject.toml").write_text("[project]\n", encoding="utf-8")
    (project / "uv.lock").write_text("", encoding="utf-8")
    resolved = ConfigService(str(project)).get_config()
    assert resolved["env_status"]["auto_detected"]["BUILD_SYSTEM"] == "uv"


def test_detects_a_node_project(project: Path):
    (project / "package.json").write_text("{}", encoding="utf-8")
    resolved = ConfigService(str(project)).get_config()
    assert resolved["env_status"]["auto_detected"]["BUILD_SYSTEM"] == "npm"
    assert resolved["env_status"]["auto_detected"]["PROJECT_LANGUAGE"] == "typescript"


def test_user_values_survive_a_rewrite(python_project: Path):
    service = ConfigService(str(python_project))
    service.write_config()

    text = service.env_file.read_text(encoding="utf-8")
    text = text.replace("TEST_COMMAND=", "TEST_COMMAND=uv run pytest")
    text = text.replace("COVERAGE_THRESHOLD=80", "COVERAGE_THRESHOLD=95")
    service.env_file.write_text(text, encoding="utf-8")

    resolved = service.write_config()

    assert resolved["config"]["TEST_COMMAND"] == "uv run pytest"
    assert resolved["config"]["COVERAGE_THRESHOLD"] == "95"
    assert "TEST_COMMAND" not in resolved["env_status"]["needs_input"]


def test_unknown_keys_are_preserved_rather_than_dropped(python_project: Path):
    service = ConfigService(str(python_project))
    service.write_config()
    with service.env_file.open("a", encoding="utf-8") as handle:
        handle.write("MY_CUSTOM_KEY=custom-value\n")

    resolved = service.write_config()

    assert "MY_CUSTOM_KEY=custom-value" in service.env_file.read_text(encoding="utf-8")
    assert "MY_CUSTOM_KEY" in resolved["env_status"]["unknown_keys"]


def test_explanations_survive_a_rewrite(python_project: Path):
    service = ConfigService(str(python_project))
    service.write_config()
    service.write_config()
    text = service.env_file.read_text(encoding="utf-8")
    assert text.count("# NEEDS INPUT: no safe default.") >= 1
    assert "── Build and test" in text


def test_precedence_is_file_then_detection_then_default(project: Path):
    (project / "package.json").write_text("{}", encoding="utf-8")
    service = ConfigService(str(project))
    service.config_dir.mkdir(parents=True)
    service.env_file.write_text("BUILD_SYSTEM=custom-build\n", encoding="utf-8")

    config = service.get_config()["config"]

    assert config["BUILD_SYSTEM"] == "custom-build"  # file beats detection
    assert config["PROJECT_LANGUAGE"] == "typescript"  # detection beats default
    assert config["COVERAGE_THRESHOLD"] == "80"  # default fills the rest


def test_empty_value_in_file_does_not_erase_a_default(python_project: Path):
    service = ConfigService(str(python_project))
    service.config_dir.mkdir(parents=True)
    service.env_file.write_text("WIKI_DIR=\n", encoding="utf-8")
    assert service.get_config()["config"]["WIKI_DIR"] == ".docs"


def test_quoted_values_are_unwrapped(python_project: Path):
    service = ConfigService(str(python_project))
    service.config_dir.mkdir(parents=True)
    service.env_file.write_text('TEST_COMMAND="uv run pytest"\n', encoding="utf-8")
    assert service.get_config()["config"]["TEST_COMMAND"] == "uv run pytest"


def test_is_enabled_reads_boolean_flags(python_project: Path):
    service = ConfigService(str(python_project))
    service.config_dir.mkdir(parents=True)
    service.env_file.write_text(
        "ENABLE_NOTEBOOKS=true\nENABLE_COMPLIANCE=false\nENABLE_DEVIATION=YES\n",
        encoding="utf-8",
    )
    assert service.is_enabled("ENABLE_NOTEBOOKS")
    assert not service.is_enabled("ENABLE_COMPLIANCE")
    assert service.is_enabled("ENABLE_DEVIATION")


def test_defaults_reflect_the_documented_stance(python_project: Path):
    config = ConfigService(str(python_project)).get_config()["config"]
    assert config["STRIP_AI_COAUTHORS"] == "true"
    assert config["AUTO_INSTALL_MCPS"] == "false"
    assert config["WIKI_DIR"] == ".docs"


def test_generated_state_is_gitignored_but_config_is_not(python_project: Path):
    service = ConfigService(str(python_project))
    service.write_config()
    lines = (service.config_dir / ".gitignore").read_text(encoding="utf-8").splitlines()
    patterns = [l.strip() for l in lines if l.strip() and not l.startswith("#")]
    assert "cache/" in patterns
    assert "config.env" not in patterns
