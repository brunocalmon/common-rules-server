"""Project configuration for the orchestration server.

Configuration lives in ``.common-rules-server/config.env`` inside the project
being worked on. Three properties matter and each one is load-bearing:

* **Always explicit.** Every key the server knows about is written to the file,
  even when it holds a default. A key that is absent from the file is a key the
  user cannot discover.
* **Always explained.** Every key is written with a comment describing what it
  does and what a good value looks like. A bare ``LINT_COMMAND=`` teaches
  nothing.
* **Never destructive.** Rewriting the file preserves user values, user
  comments on unknown keys, and any key the server does not recognise.

Keys with no safe default are written empty and reported in ``needs_input`` so
the agent can ask the user instead of guessing.
"""

import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

CONFIG_DIRNAME = ".common-rules-server"
CONFIG_FILENAME = "config.env"


@dataclass(frozen=True)
class ConfigKey:
    name: str
    group: str
    description: str
    default: Optional[str] = None
    example: Optional[str] = None
    #: True when the key has no safe default and the agent must ask the user.
    needs_input: bool = False


@dataclass
class DetectionResult:
    values: dict = field(default_factory=dict)
    evidence: dict = field(default_factory=dict)


# Ordered: the file is written in this order, grouped by `group`.
CONFIG_SCHEMA: tuple[ConfigKey, ...] = (
    ConfigKey(
        "PROJECT_NAME",
        "Project identity",
        "Human-readable project name, used in generated reports.",
        default=None,
        example="my-service",
        needs_input=True,
    ),
    ConfigKey(
        "PROJECT_LANGUAGE",
        "Project identity",
        "Primary implementation language. Auto-detected when left empty.",
        example="python, java, typescript, rust, go",
    ),
    ConfigKey(
        "BUILD_SYSTEM",
        "Project identity",
        "Build system in use. Auto-detected when left empty.",
        example="uv, npm, gradle, maven, cargo",
    ),
    ConfigKey(
        "README_PATH",
        "Documentation",
        "Root README. Under the Wiki Hub model this file is a hub only — it "
        "links into the wiki and carries no long-form content of its own.",
        default="README.md",
    ),
    ConfigKey(
        "WIKI_DIR",
        "Documentation",
        "Directory holding the project wiki. All substantive documentation "
        "lives here, not in the root README.",
        default=".docs",
    ),
    ConfigKey(
        "DOCS_PROTOCOL",
        "Documentation",
        "Path to the documentation protocol that governs how decisions are "
        "recorded, superseded and cross-linked.",
        default=".docs/DOCUMENTATION-PROTOCOL.md",
    ),
    ConfigKey(
        "DOCS_DIR",
        "Documentation",
        "Directory for generated artefacts such as research notes and tickets.",
        default=".docs",
    ),
    ConfigKey(
        "BUILD_COMMAND",
        "Build and test",
        "Command that builds the project. Leave empty if the project has no "
        "separate build step.",
        example="uv build, npm run build, ./gradlew build",
    ),
    ConfigKey(
        "TEST_COMMAND",
        "Build and test",
        "Command that runs the test suite.",
        example="uv run pytest, npm test, ./gradlew test",
        needs_input=True,
    ),
    ConfigKey(
        "COVERAGE_COMMAND",
        "Build and test",
        "Command that produces a coverage report.",
        example="uv run pytest --cov",
    ),
    ConfigKey(
        "COVERAGE_THRESHOLD",
        "Build and test",
        "Minimum acceptable coverage percentage.",
        default="80",
    ),
    ConfigKey(
        "LINT_COMMAND",
        "Code style",
        "Command that runs the linter.",
        example="uv run ruff check ., npm run lint",
    ),
    ConfigKey(
        "LINT_FILE_COMMAND",
        "Code style",
        "Command that lints a single file, with the path appended. Used by the "
        "post-edit hook. Left empty the hook does nothing, because running a "
        "whole-project lint after every edit is slow enough to be switched off.",
        example="uv run ruff check, npx eslint",
    ),
    ConfigKey(
        "LINTER_TOOL",
        "Code style",
        "Linter in use. Enables the optional code-style resource when set.",
        example="ruff, eslint, checkstyle, clippy",
    ),
    ConfigKey(
        "LINTER_CONFIG",
        "Code style",
        "Path to the linter configuration file.",
        example="ruff.toml, .eslintrc.json, config/checkstyle.xml",
    ),
    ConfigKey(
        "RESOURCES_DIR",
        "Resources",
        "Directory holding project-local resources. Anything here overrides a "
        "built-in resource of the same kind and name.",
        default=".common-rules-server/resources",
    ),
    ConfigKey(
        "BDD_FILE_PATH",
        "Agent BDD",
        "Gherkin feature file the agent walks scenario by scenario.",
        default="agent_bdd.feature",
    ),
    ConfigKey(
        "ENABLE_NOTEBOOKS",
        "Optional features",
        "Track decisions in dated notebook files. Enables the /notebook resource.",
        default="false",
    ),
    ConfigKey(
        "NOTEBOOK_DIR",
        "Optional features",
        "Directory for notebook entries.",
        default="./notebook",
    ),
    ConfigKey(
        "ENABLE_DAILY_LOGBOOK",
        "Optional features",
        "Roll notebook entries into a daily summary. Enables /daily-logbook.",
        default="false",
    ),
    ConfigKey(
        "ENABLE_DEVIATION",
        "Optional features",
        "Require an explicit record when the documented process is departed "
        "from. Enables /deviation.",
        default="false",
    ),
    ConfigKey(
        "ENABLE_COMPLIANCE",
        "Optional features",
        "Validate work against documented requirements. Enables /compliance.",
        default="false",
    ),
    ConfigKey(
        "STRIP_AI_COAUTHORS",
        "Authorship",
        "Install a commit-msg hook that removes co-author and 'generated with' "
        "trailers injected by AI coding agents, so commit authorship stays "
        "yours. Human co-author trailers are left untouched.",
        default="true",
    ),
    ConfigKey(
        "AUTO_INSTALL_MCPS",
        "Companion servers",
        "Allow this server to write companion MCP servers into your editor's "
        "MCP configuration. Off by default because that file is shared with "
        "every project; when off, setup reports what is missing instead.",
        default="false",
    ),
    ConfigKey(
        "COMMIT_PREFIX",
        "Advanced",
        "Prefix applied to commit messages.",
        example="feat:, [PROJ-123]",
    ),
    ConfigKey(
        "DEPLOY_COMMAND",
        "Advanced",
        "Command that deploys the project. Leave empty if not applicable.",
    ),
    ConfigKey(
        "PRE_COMMIT_COMMAND",
        "Advanced",
        "Checks to run before committing. Leave empty to skip.",
    ),
)

SCHEMA_BY_NAME = {key.name: key for key in CONFIG_SCHEMA}

# Marker files that identify a build system, most specific first.
_BUILD_SIGNATURES: tuple[tuple[str, str, str], ...] = (
    ("uv.lock", "uv", "python"),
    ("poetry.lock", "poetry", "python"),
    ("pyproject.toml", "python", "python"),
    ("requirements.txt", "pip", "python"),
    ("pnpm-lock.yaml", "pnpm", "typescript"),
    ("yarn.lock", "yarn", "typescript"),
    ("package.json", "npm", "typescript"),
    ("build.gradle.kts", "gradle", "kotlin"),
    ("build.gradle", "gradle", "java"),
    ("pom.xml", "maven", "java"),
    ("Cargo.toml", "cargo", "rust"),
    ("go.mod", "go", "go"),
)


class ConfigService:
    """Reads, resolves and writes project configuration."""

    def __init__(self, project_root: Optional[str] = None):
        # Resolved, not stored as given: a relative root such as "." has an
        # empty `.name`, which silently produced a blank detected PROJECT_NAME.
        self.project_root = (
            Path(project_root).resolve() if project_root else Path(os.getcwd()).resolve()
        )
        self.config_dir = self.project_root / CONFIG_DIRNAME
        self.env_file = self.config_dir / CONFIG_FILENAME

    # ------------------------------------------------------------------ read

    def _read_env_file(self) -> dict[str, str]:
        """Parses the config file. Unknown keys are preserved, not dropped."""
        values: dict[str, str] = {}
        if not self.env_file.exists():
            return values

        for line in self.env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            if key:
                values[key] = value.strip().strip('"').strip("'")
        return values

    def detect(self) -> DetectionResult:
        """Infers build system and language from files on disk."""
        result = DetectionResult()
        for marker, build_system, language in _BUILD_SIGNATURES:
            if (self.project_root / marker).exists():
                result.values["BUILD_SYSTEM"] = build_system
                result.values["PROJECT_LANGUAGE"] = language
                result.evidence["BUILD_SYSTEM"] = marker
                result.evidence["PROJECT_LANGUAGE"] = marker
                break

        if "PROJECT_NAME" not in result.values:
            result.values["PROJECT_NAME"] = self.project_root.name
            result.evidence["PROJECT_NAME"] = "project directory name"

        return result

    def get_config(self) -> dict[str, Any]:
        """Resolves configuration.

        Precedence, highest first: explicit file value, auto-detected value,
        schema default.
        """
        detection = self.detect()
        file_values = self._read_env_file()

        resolved: dict[str, str] = {}
        for key in CONFIG_SCHEMA:
            if key.default is not None:
                resolved[key.name] = key.default

        for name, value in detection.values.items():
            resolved[name] = value

        # An empty value in the file means "unset", not "override with empty" —
        # otherwise a freshly generated file would blank every default it wrote.
        for name, value in file_values.items():
            if value != "":
                resolved[name] = value

        for key in CONFIG_SCHEMA:
            resolved.setdefault(key.name, "")

        needs_input = [
            key.name
            for key in CONFIG_SCHEMA
            if key.needs_input and not str(resolved.get(key.name, "")).strip()
        ]
        unset_optional = [
            key.name
            for key in CONFIG_SCHEMA
            if not key.needs_input and not str(resolved.get(key.name, "")).strip()
        ]

        return {
            "config": resolved,
            "env_status": {
                "file_exists": self.env_file.exists(),
                "file_path": str(self.env_file),
                "config_dir": str(self.config_dir),
                "needs_input": needs_input,
                "unset_optional": unset_optional,
                "auto_detected": detection.values,
                "detection_evidence": detection.evidence,
                "unknown_keys": sorted(k for k in file_values if k not in SCHEMA_BY_NAME),
            },
        }

    def is_enabled(self, key_name: str) -> bool:
        """True when a boolean-ish config key is switched on."""
        value = str(self.get_config()["config"].get(key_name, "")).strip().lower()
        return value in ("true", "1", "yes", "on")

    # ----------------------------------------------------------------- write

    def render_config_file(self, values: dict[str, str], extra: dict[str, str]) -> str:
        """Renders the annotated config file body."""
        lines = [
            "# " + "=" * 68,
            "# Common Rules — project configuration",
            "# " + "=" * 68,
            "# Generated by the setup_config tool. Safe to edit by hand: values you",
            "# set here always win, and regenerating this file preserves them.",
            "#",
            "# Every key this server understands is listed, including the ones left",
            "# empty, so nothing is hidden from you. Keys marked NEEDS INPUT have no",
            "# safe default — the agent should ask you rather than guess.",
            "# " + "=" * 68,
        ]

        current_group = None
        for key in CONFIG_SCHEMA:
            if key.group != current_group:
                current_group = key.group
                lines.append("")
                lines.append(f"# ── {key.group} " + "─" * max(0, 60 - len(key.group)))

            lines.append("")
            for chunk in _wrap(key.description, 72):
                lines.append(f"# {chunk}")
            if key.example:
                lines.append(f"# Example: {key.example}")
            if key.needs_input:
                lines.append("# NEEDS INPUT: no safe default.")
            elif key.default is not None:
                lines.append(f"# Default: {key.default}")
            lines.append(f"{key.name}={values.get(key.name, '')}")

        if extra:
            lines.append("")
            lines.append("# ── Custom keys " + "─" * 47)
            lines.append("# Not recognised by this server; preserved so you do not lose them.")
            for name in sorted(extra):
                lines.append(f"{name}={extra[name]}")

        lines.append("")
        return "\n".join(lines)

    def write_config(self) -> dict[str, Any]:
        """Creates or refreshes the config file, then returns resolved config.

        Values already present in the file are preserved verbatim. Detected
        values are only written into keys the user has not set.
        """
        self.config_dir.mkdir(parents=True, exist_ok=True)

        file_values = self._read_env_file()
        detection = self.detect()

        to_write: dict[str, str] = {}
        for key in CONFIG_SCHEMA:
            if key.name in file_values and file_values[key.name] != "":
                to_write[key.name] = file_values[key.name]
            elif key.name in detection.values:
                to_write[key.name] = detection.values[key.name]
            elif key.default is not None:
                to_write[key.name] = key.default
            else:
                to_write[key.name] = ""

        extra = {k: v for k, v in file_values.items() if k not in SCHEMA_BY_NAME}

        _atomic_write(self.env_file, self.render_config_file(to_write, extra))
        _ensure_gitignore(self.config_dir)

        return self.get_config()


def _wrap(text: str, width: int) -> list[str]:
    """Minimal greedy wrap, kept local to avoid a textwrap import for one call."""
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > width and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or [""]


def _atomic_write(path: Path, content: str) -> None:
    """Writes via a temp file in the same directory, then renames.

    A partial write here would leave the project without usable configuration,
    and the rename is what makes that impossible.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
        os.replace(tmp, path)
    except Exception:
        Path(tmp).unlink(missing_ok=True)
        raise


def _ensure_gitignore(config_dir: Path) -> None:
    """Keeps generated state out of git while keeping config itself in it.

    The config file is worth committing — it describes the project. Anything the
    server caches beside it is not.
    """
    gitignore = config_dir / ".gitignore"
    if gitignore.exists():
        return
    gitignore.write_text(
        "# Generated state. The config.env beside this file is meant to be committed.\n"
        "cache/\n"
        "*.tmp\n",
        encoding="utf-8",
    )
