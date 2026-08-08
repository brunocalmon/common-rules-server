"""Loading, resolving and creating orchestration resources.

Resources come from two places. Built-in resources ship with this server and
form the default kit. Project resources live under the project's
``RESOURCES_DIR`` and override a built-in of the same kind and name — that is
what lets a project keep the shape of the default kit while changing one skill.

Two behaviours here are worth calling out because getting them wrong is silent:

* **Placeholder resolution** replaces ``{{KEY}}`` only for keys the config layer
  knows. Report templates use the same syntax for their fill-in slots, so
  blanket substitution would destroy them. See ``util.placeholders``.
* **Optional resources** declare a ``gate`` naming a config flag. They stay out
  of the catalogue until that flag is on, so a project that does not use
  notebooks never sees notebook instructions.
"""

import logging
import re
from pathlib import Path
from typing import Any, Optional

from common_rules_server.service.config_service import ConfigService
from common_rules_server.util import placeholders
from common_rules_server.util.resource_parsing import (
    VALID_KINDS,
    extract_script,
    parse_resource,
)

logger = logging.getLogger(__name__)

TEMPLATES_DIRNAME = "templates"
SAFE_NAME = re.compile(r"\A[a-z0-9]+(-[a-z0-9]+)*\Z")


class ResourceService:
    def __init__(
        self,
        config_service: ConfigService,
        built_in_dir: Optional[str] = None,
    ):
        self.config_service = config_service
        self.built_in_dir = (
            Path(built_in_dir) if built_in_dir else Path(__file__).resolve().parent.parent / "resources"
        )
        self._cache: Optional[dict] = None
        self._cache_signature: Optional[tuple] = None

    # ---------------------------------------------------------------- paths

    @property
    def project_root(self) -> Path:
        return self.config_service.project_root

    def _resources_dir(self, config: dict) -> Path:
        configured = str(config.get("RESOURCES_DIR") or ".common-rules-server/resources")
        path = Path(configured)
        return path if path.is_absolute() else self.project_root / path

    @property
    def templates_dir(self) -> Path:
        return self.built_in_dir / TEMPLATES_DIRNAME

    def _resource_files(self, root: Path) -> list[Path]:
        """Every markdown file under ``root`` except output templates."""
        if not root.is_dir():
            return []
        return sorted(
            path
            for path in root.rglob("*.md")
            if TEMPLATES_DIRNAME not in path.relative_to(root).parts
        )

    # --------------------------------------------------------------- loading

    def _signature(self, config: dict) -> tuple:
        """Cheap fingerprint of everything that can change the catalogue."""
        stamps = []
        for root in (self.built_in_dir, self._resources_dir(config)):
            for path in self._resource_files(root):
                try:
                    stamps.append((str(path), path.stat().st_mtime_ns))
                except OSError:
                    continue
        return (tuple(stamps), tuple(sorted(config.items())))

    def load(self, force: bool = False) -> dict[str, Any]:
        """Loads the resource catalogue, reusing the cache when nothing changed."""
        resolved = self.config_service.get_config()
        config = resolved["config"]
        signature = self._signature(config)

        if not force and self._cache is not None and signature == self._cache_signature:
            return self._cache

        resources: dict[str, dict] = {}
        problems: list[dict] = []
        skipped_gated: list[dict] = []

        for source, root in (
            ("built-in", self.built_in_dir),
            ("project", self._resources_dir(config)),
        ):
            for path in self._resource_files(root):
                record = self._load_file(path, source, config)
                if record is None:
                    continue
                if "error" in record:
                    problems.append(record)
                    continue
                if record.pop("_gated_out", False):
                    skipped_gated.append(
                        {"kind": record["kind"], "name": record["name"], "gate": record["gate"]}
                    )
                    continue

                key = f"{record['kind']}:{record['name']}"
                if key in resources and source == "project":
                    record["overrides"] = resources[key]["file"]
                resources[key] = record

        catalogue = {
            "config": config,
            "env_status": resolved["env_status"],
            "resources": resources,
            "problems": problems,
            "gated_out": skipped_gated,
        }
        self._cache = catalogue
        self._cache_signature = signature
        return catalogue

    def _load_file(self, path: Path, source: str, config: dict) -> Optional[dict]:
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            return {"file": str(path), "error": f"unreadable: {exc}"}

        parsed = parse_resource(text)
        if not parsed.ok:
            return {"file": str(path), "error": "; ".join(parsed.errors)}

        header = parsed.header
        record = dict(header)
        record["source"] = source
        record["file"] = str(path)
        record["raw_body"] = parsed.body

        gate = str(header.get("gate", "")).strip()
        if gate:
            record["gate"] = gate
            if not self.config_service.is_enabled(gate):
                record["_gated_out"] = True
                return record

        body, used, unresolved = placeholders.resolve(parsed.body, config)
        record["body"] = body
        record["resolved_env"] = used
        record["unresolved_env"] = unresolved

        # A hook's script is the executable part of the resource, so it is
        # lifted out of the prose and resolved like any other instruction.
        if record["kind"] == "hook":
            record["script"] = extract_script(body)

        return record

    # ------------------------------------------------------------------ API

    def get_context(self) -> dict[str, Any]:
        """The discovery map: everything the agent needs to choose, nothing more.

        Bodies are deliberately excluded. The agent reads names, descriptions and
        relationships here, then calls ``get_resource`` for the one it needs.
        """
        catalogue = self.load()
        resources = catalogue["resources"]

        entries = []
        counts = {kind: 0 for kind in VALID_KINDS}
        for record in sorted(resources.values(), key=lambda r: (r["kind"], r["name"])):
            counts[record["kind"]] = counts.get(record["kind"], 0) + 1
            entry = {
                "kind": record["kind"],
                "name": record["name"],
                "description": record["description"],
                "relationships": record.get("relationships", {}),
                "env": record.get("env", {"requires": [], "optional": []}),
                "source": record["source"],
            }
            if record.get("self_check"):
                entry["self_check"] = record["self_check"]
            for optional_field in (
                "type", "trigger", "schedule", "wraps", "phases", "gate", "event", "blocking",
            ):
                if optional_field in record:
                    entry[optional_field] = record[optional_field]
            if record.get("unresolved_env"):
                entry["unresolved_env"] = record["unresolved_env"]
            entries.append(entry)

        overrides = [r["name"] for r in resources.values() if r["source"] == "project"]

        return {
            "config": catalogue["config"],
            "env_status": catalogue["env_status"],
            "resources": entries,
            "resource_counts": counts,
            "total_resources": len(entries),
            "project_overrides": sorted(overrides),
            "gated_out": catalogue["gated_out"],
            "problems": catalogue["problems"],
            "integrity": self.check_integrity(),
            "usage": (
                "Call get_resource(kind, name) for full instructions. Resources "
                "reference each other as /name in their relationship tables."
            ),
        }

    def hooks(self) -> list[dict]:
        """Every loaded hook that carries a usable script."""
        return [
            record
            for record in self.load()["resources"].values()
            if record["kind"] == "hook" and record.get("script")
        ]

    def get_resource(self, kind: str, name: str) -> dict[str, Any]:
        """Full content of one resource, with its output template attached."""
        catalogue = self.load()
        record = catalogue["resources"].get(f"{kind}:{name}")

        if record is None:
            gated = next(
                (g for g in catalogue["gated_out"] if g["kind"] == kind and g["name"] == name),
                None,
            )
            if gated:
                return {
                    "error": (
                        f"The {kind} '{name}' exists but is switched off in this "
                        f"project."
                    ),
                    "gate": gated["gate"],
                    "hint": (
                        f"Set {gated['gate']}=true in "
                        f"{catalogue['env_status']['file_path']} to enable it. Ask the "
                        f"user before changing project configuration."
                    ),
                }

            available = sorted(
                r["name"] for r in catalogue["resources"].values() if r["kind"] == kind
            )
            return {
                "error": f"No {kind} named '{name}'.",
                "available": available,
                "gated_off": sorted(
                    g["name"] for g in catalogue["gated_out"] if g["kind"] == kind
                ),
                "hint": "Call get_context() to list every resource.",
            }

        result = {
            key: value
            for key, value in record.items()
            if key not in ("raw_body", "_gated_out")
        }
        template_ref = (record.get("relationships") or {}).get("output")
        result["template_ref"] = template_ref
        result["template"] = self._read_template(template_ref, catalogue["config"])
        return result

    def read_template(self, ref: Optional[str]) -> Optional[str]:
        """Public accessor for an output template's content."""
        return self._read_template(ref, self.config_service.get_config()["config"])

    def _read_template(self, ref: Optional[str], config: dict) -> Optional[str]:
        """Reads an output template. Templates keep their own placeholders.

        A template's ``{{STATUS}}`` is a slot the agent fills when writing the
        report, so nothing is substituted here.
        """
        if not ref:
            return None
        name = Path(str(ref)).name
        path = self.templates_dir / name
        if not path.is_file():
            return None
        try:
            return path.read_text(encoding="utf-8")
        except OSError:
            return None

    def create_resource(
        self,
        kind: str,
        name: str,
        description: str,
        body: str,
        extra_fields: Optional[dict] = None,
    ) -> dict[str, Any]:
        """Writes a new project-scoped resource.

        Always lands in ``RESOURCES_DIR/<kind>/<name>.md``. The kind directory is
        what keeps a rule and a skill of the same name from overwriting each
        other, and the name check is what keeps a crafted name from escaping the
        resources directory.
        """
        kind = str(kind).strip().lower()
        name = str(name).strip().lower()

        if kind not in VALID_KINDS:
            return {
                "created": False,
                "error": f"Invalid kind '{kind}'. Expected one of: {', '.join(VALID_KINDS)}.",
            }
        if not SAFE_NAME.match(name):
            return {
                "created": False,
                "error": f"Invalid name '{name}'. Use kebab-case (letters, digits, hyphens).",
            }
        if not str(description).strip():
            return {"created": False, "error": "A description is required."}

        header: dict[str, Any] = {"kind": kind, "name": name, "description": description.strip()}
        # Supply the field each kind cannot be routed without, so a resource
        # created through this tool is always valid on the next load.
        if kind == "rule":
            header["type"] = "Agent Requested"
        elif kind == "skill":
            header["trigger"] = "user-invoked"
        header.update(extra_fields or {})

        if kind == "hook" and not str(header.get("event", "")).strip():
            from common_rules_server.util.resource_parsing import VALID_HOOK_EVENTS

            return {
                "created": False,
                "error": (
                    "A hook must declare an 'event' in extra_fields, and its body "
                    "must contain a ```sh block."
                ),
                "valid_events": list(VALID_HOOK_EVENTS),
                "authoring_contract": (
                    "The script is a fragment, not a whole script. It runs with "
                    "HOOK_INPUT, HOOK_COMMAND, HOOK_FILE, HOOK_EVENT and PROJECT_DIR "
                    "available, and communicates by setting `decision` to allow, ask "
                    "or deny, and `message` to one line. Match HOOK_COMMAND at "
                    "command position rather than searching HOOK_INPUT, or the hook "
                    "will fire on text that merely mentions a command."
                ),
            }

        content = _render_resource(header, body)

        parsed = parse_resource(content)
        if not parsed.ok:
            return {
                "created": False,
                "error": "Generated resource failed validation.",
                "validation": {"valid": False, "errors": parsed.errors},
            }

        config = self.config_service.get_config()["config"]
        target_dir = self._resources_dir(config) / f"{kind}s"
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / f"{name}.md"

        existed = target.exists()
        target.write_text(content, encoding="utf-8")
        self._cache = None

        warnings = []
        if existed:
            warnings.append(f"Replaced an existing project {kind} named '{name}'.")
        if f"{kind}:{name}" in (self._builtin_keys()):
            warnings.append(f"This overrides the built-in {kind} '{name}'.")

        try:
            display_path = str(target.relative_to(self.project_root))
        except ValueError:
            display_path = str(target)

        return {
            "created": True,
            "path": display_path,
            "absolute_path": str(target),
            "kind": kind,
            "name": name,
            "validation": {"valid": True, "errors": [], "warnings": warnings},
        }

    def _builtin_keys(self) -> set[str]:
        keys = set()
        for path in self._resource_files(self.built_in_dir):
            parsed = parse_resource(path.read_text(encoding="utf-8"))
            if parsed.ok:
                keys.add(f"{parsed.header['kind']}:{parsed.header['name']}")
        return keys

    # ------------------------------------------------------------ integrity

    def check_integrity(self) -> dict[str, Any]:
        """Validates the catalogue as a graph, not just file by file.

        A resource can parse perfectly and still be broken — by pointing at a
        skill that does not exist, or naming an output template that was never
        written. Those only show up when the whole set is examined together.
        """
        catalogue = self.load()
        resources = catalogue["resources"]
        known = {f"/{record['name']}" for record in resources.values()}

        dangling: list[dict] = []
        missing_templates: list[dict] = []

        for record in resources.values():
            relationships = record.get("relationships") or {}
            for relation in ("comes_from", "goes_to", "can_invoke", "uses"):
                for edge in relationships.get(relation, []):
                    target = edge.get("target", "")
                    if target.startswith("/") and target not in known:
                        dangling.append(
                            {
                                "from": f"{record['kind']}:{record['name']}",
                                "relation": relation,
                                "target": target,
                            }
                        )
            output = relationships.get("output")
            if output and not (self.templates_dir / Path(str(output)).name).is_file():
                missing_templates.append(
                    {"resource": f"{record['kind']}:{record['name']}", "template": output}
                )

        for phase in _all_phases(resources.values()):
            for skill_ref in phase.get("skills", []) or []:
                if str(skill_ref).startswith("/") and str(skill_ref) not in known:
                    dangling.append(
                        {"from": phase["_owner"], "relation": "phase", "target": skill_ref}
                    )

        return {
            "ok": not (catalogue["problems"] or dangling or missing_templates),
            "unparseable": catalogue["problems"],
            "dangling_references": dangling,
            "missing_templates": missing_templates,
        }


def _all_phases(records) -> list[dict]:
    phases = []
    for record in records:
        for phase in record.get("phases") or []:
            if isinstance(phase, dict):
                enriched = dict(phase)
                enriched["_owner"] = f"{record['kind']}:{record['name']}"
                phases.append(enriched)
    return phases


def _render_resource(header: dict, body: str) -> str:
    """Serialises a resource, keeping frontmatter key order stable and readable."""
    import yaml

    front = yaml.safe_dump(header, sort_keys=False, allow_unicode=True, default_flow_style=False)
    return f"---\n{front}---\n\n{(body or '').strip()}\n"
