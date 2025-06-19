import asyncio
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from mcp.types import TextContent
import re
import sys
import logging
from common_rules_server.service.rule_service import RuleService
from common_rules_server.util.rule_parsing import parse_yaml_header_and_body

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger("common-rules-server")

# Create the MCP server
mcp = FastMCP("common-rules-server")

# Init on a global constant
ROOT_DIR = Path(__file__).parent
RULES_DIR = ROOT_DIR / "resources" / "rules"
SYSTEM_RULES_DIR = RULES_DIR / "system"
USER_RULES_DIR = RULES_DIR / "user"
ARTIFACTS_DIR = ROOT_DIR / "resources" / "artifacts"


# Helper to recursively read and parse all rule files in a directory and its subdirectories
# Only accept .md files with a valid YAML header (description and type required)
def read_rule_files_with_headers_recursive(directory: Path):
    rules = []
    if not directory.exists() or not directory.is_dir():
        logging.warning(f"Rules directory does not exist: {directory}")
        return rules
    for file in sorted(directory.rglob("*.md")):
        try:
            text = file.read_text(encoding="utf-8")
            header, body = parse_yaml_header_and_body(text)
            if header is None:
                continue
            rules.append({"header": header, "body": body, "file": file})
        except Exception as e:
            logging.error(f"Error reading rule file {file}: {e}")
    return rules

# Helper to determine rule type from header (new YAML only)
def get_rule_type(header):
    return header.get("type", "").strip()

# Helper to get rule title/key
def get_rule_title(header, file):
    if "title" in header and header["title"].strip():
        return header["title"].strip()
    return file.stem.replace("_", "-")

# Helper to get rule description
def get_rule_description(header):
    return header.get("description", "")

# Helper to get rule globs
def get_rule_globs(header):
    return header.get("globs", "")

# Helper to parse .mdc user rule files (no header, just markdown)
def parse_mdc_user_rule(text, file):
    lines = text.splitlines()
    title = None
    description = None
    rule_intent_desc = None
    # Find first heading as title
    for i, line in enumerate(lines):
        if line.strip().startswith('# '):
            title = line.strip().lstrip('#').strip()
            # Try to find first non-heading, non-empty line as description
            for desc_line in lines[i+1:]:
                if desc_line.strip() and not desc_line.strip().startswith('#'):
                    description = desc_line.strip()
                    break
            break
    # Find ## Rule Intent section for agent requested description
    for i, line in enumerate(lines):
        if line.strip().lower() == '## rule intent':
            # Collect all non-heading, non-empty lines after this as rule_intent_desc
            desc_lines = []
            for desc_line in lines[i+1:]:
                if desc_line.strip().startswith('#'):
                    break
                if desc_line.strip():
                    desc_lines.append(desc_line.strip())
            if desc_lines:
                rule_intent_desc = ' '.join(desc_lines)
            break
    if not title:
        title = file.stem.replace('_', '-')
    if not description:
        description = ''
    return title, description, rule_intent_desc

def read_user_rule_files_with_headers_recursive(directory: Path):
    rules = []
    for ext in ("*.md", "*.mdc"):
        for file in sorted(directory.rglob(ext)):
            try:
                text = file.read_text(encoding="utf-8")
                if file.suffix == ".mdc":
                    header, body = parse_mdc_header_and_body(text)
                else:
                    header, body = parse_yaml_header_and_body(text)
                key = file.stem.replace("_", "-")
                rule_type = get_rule_type(header)
                rules.append({
                    "key": key,
                    "header": header,
                    "body": body,
                    "file": file,
                    "type": rule_type,
                    "relative_path": str(file.relative_to(directory))
                })
            except Exception as e:
                logging.error(f"Error reading user rule file {file}: {e}")
    return rules

# Helper to extract description from header or # Description section
def extract_description(header, body, file):
    # 1. If YAML header has description, use it
    desc = header.get("description", "").strip()
    if desc:
        return desc
    # 2. Otherwise, look for a # Description section in the body
    lines = body.splitlines()
    in_desc = False
    desc_lines = []
    for line in lines:
        if line.strip().lower().startswith('# description'):
            in_desc = True
            continue
        if in_desc:
            if line.strip().startswith('#') and not line.strip().lower().startswith('# description'):
                break
            if line.strip():
                desc_lines.append(line.strip())
    if desc_lines:
        return ' '.join(desc_lines)
    return ''

# New helper to get rules as {key, description, type}
def get_rules_summary(directory: Path):
    rules = []
    if not directory.exists() or not directory.is_dir():
        logging.warning(f"Rules directory does not exist: {directory}")
        return rules
    for file in sorted(directory.rglob("*.md")):
        try:
            text = file.read_text(encoding="utf-8")
            header, body = parse_yaml_header_and_body(text)
            if header is None:
                continue
            key = file.stem.replace("_", "-")
            rule_type = get_rule_type(header)
            description = get_rule_description(header)
            artifacts = header.get("artifacts", [])
            rules.append({
                "key": key,
                "description": description,
                "type": rule_type,
                "artifacts": artifacts
            })
        except Exception as e:
            logging.error(f"Error reading rule file {file}: {e}")
    return rules

@mcp.tool()
def get_system_rules() -> list[dict]:
    return get_rules_summary(SYSTEM_RULES_DIR)

@mcp.tool()
def get_user_rules(rule_name: str = None) -> list[dict]:
    rules = get_rules_summary(USER_RULES_DIR)
    if rule_name:
        rule_name = rule_name.lower()
        rules = [r for r in rules if rule_name in r["key"].lower()]
    return rules

@mcp.tool()
def get_system_rule(title: str) -> TextContent:
    for file in sorted(SYSTEM_RULES_DIR.rglob("*.md")):
        try:
            text = file.read_text(encoding="utf-8")
            header, body = parse_yaml_header_and_body(text)
            if header is None:
                continue
            key = file.stem.replace("_", "-")
            if title.strip().lower().replace("_", "-") == key.lower():
                return TextContent(type="text", text=body)
        except Exception as e:
            logging.error(f"Error reading rule file {file}: {e}")
    return TextContent(type="text", text=f"Rule '{title}' not found.")

@mcp.tool()
def get_user_rule(title: str) -> TextContent:
    for file in sorted(USER_RULES_DIR.rglob("*.md")):
        try:
            text = file.read_text(encoding="utf-8")
            header, body = parse_yaml_header_and_body(text)
            if header is None:
                continue
            key = file.stem.replace("_", "-")
            if title.strip().lower().replace("_", "-") == key.lower():
                return TextContent(type="text", text=body)
        except Exception as e:
            logging.error(f"Error reading rule file {file}: {e}")
    return TextContent(type="text", text=f"Rule '{title}' not found.")

@mcp.tool()
def list_rule_categories() -> list[TextContent]:
    """List all rule categories and their types for better organization understanding"""
    result = []
    # System rules
    if SYSTEM_RULES_DIR.exists():
        system_rules = read_rule_files_with_headers_recursive(SYSTEM_RULES_DIR)
        result.append(TextContent(type="text", text="=== SYSTEM RULES (Always Applied) ==="))
        for rule in system_rules:
            rule_type = get_rule_type(rule["header"])
            key = rule["file"].stem.replace("_", "-")
            result.append(TextContent(type="text", text=f"- {key} ({rule_type})"))
    # User rules by category
    if USER_RULES_DIR.exists():
        user_rules = read_user_rule_files_with_headers_recursive(USER_RULES_DIR)
        # Group by directory/category
        categories = {}
        for rule in user_rules:
            category = rule["file"].parent.name if rule["file"].parent != USER_RULES_DIR else "root"
            if category not in categories:
                categories[category] = []
            categories[category].append(rule)
        for category, rules in categories.items():
            result.append(TextContent(type="text", text=f"\n=== USER RULES - {category.upper()} ==="))
            for rule in rules:
                rule_type = rule["type"]
                key = rule["key"]
                result.append(TextContent(type="text", text=f"- {key} ({rule_type})"))
    return result

@mcp.tool()
def get_artifact(key: str) -> TextContent:
    """Get the content of an artifact file by its key (relative path from artifacts/)."""
    artifact_path = ARTIFACTS_DIR / key
    try:
        if artifact_path.exists() and artifact_path.is_file():
            content = artifact_path.read_text(encoding="utf-8")
            return TextContent(type="text", text=content)
        else:
            return TextContent(type="text", text=f"Artifact '{key}' not found.")
    except Exception as e:
        return TextContent(type="text", text=f"Error reading artifact '{key}': {e}")

def main():
    logger.info("========================================")
    logger.info("  Common Rules MCP Server (Python)")
    logger.info("========================================")
    logger.info("Server: common-rules-server")
    logger.info("")
    logger.info("MCP server is running.")
    logger.info("- Use an MCP-compatible client, IDE, or Cursor to connect.")
    logger.info("- Exposes tools: get_system_rules, get_user_rules, get_system_rule, get_user_rule, list_rule_categories, get_artifact")
    logger.info("- Only .md rule files with strict YAML headers (description, type, artifacts) are supported.")
    logger.info("- Rules reference output templates via the artifacts field; templates are stored in artifacts/templates/.")
    logger.info("- Place rules in src/common_rules_server/resources/rules/system/ and user/ with subdirectories")
    logger.info("- Supports subfolders for better organization")
    logger.info("")
    logger.info("For SDK details: https://github.com/modelcontextprotocol/python-sdk")
    logger.info("========================================")
    mcp.run()

if __name__ == "__main__":
    main()