import asyncio
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from mcp.types import TextContent
import re
import sys
import logging
from common_rules_server.service.rule_service import RuleService
from common_rules_server.util.rule_parsing import parse_mdc_header_and_body, parse_yaml_header_and_body

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


# Helper to recursively read and parse all rule files in a directory and its subdirectories
def read_rule_files_with_headers_recursive(directory: Path):
    rules = []
    if not directory.exists() or not directory.is_dir():
        logging.warning(f"Rules directory does not exist: {directory}")
        return rules
    
    # Recursively find all .md and .mdc files
    for ext in ("*.md", "*.mdc"):
        for file in sorted(directory.rglob(ext)):
            try:
                text = file.read_text(encoding="utf-8")
                if file.suffix == ".mdc":
                    header, body = parse_mdc_header_and_body(text)
                else:
                    header, body = parse_yaml_header_and_body(text)
                rules.append({"header": header, "body": body, "file": file})
            except Exception as e:
                logging.error(f"Error reading rule file {file}: {e}")
    return rules

# Helper to determine rule type from header (Cursor .mdc or YAML)
def get_rule_type(header):
    always_apply = header.get("alwaysApply", "").strip().lower() == "true"
    description = header.get("description", "").strip()
    globs = header.get("globs", "").strip()
    if always_apply:
        return "always"
    if globs:
        return "auto attached"
    if description:
        return "agent requested"
    return "manual"

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

@mcp.tool()
def get_system_rules() -> list[TextContent]:
    rules_dir = SYSTEM_RULES_DIR
    service = RuleService(rules_dir)
    return service.get_user_rules() 

@mcp.tool()
def get_user_rules(rule_name: str = None) -> list[TextContent]:
    rules_dir = USER_RULES_DIR
    service = RuleService(rules_dir)
    return service.get_user_rules(rule_name)

@mcp.tool()
def get_system_rule(title: str) -> TextContent:
    rules_dir = SYSTEM_RULES_DIR
    service = RuleService(rules_dir)
    rules = service.load_rules()
    title_norm = title.strip().lower().replace("_", "-")
    for rule in rules:
        if title_norm == rule.key.lower():
            return TextContent(type="text", text=rule.body)
    return TextContent(type="text", text=f"Rule '{title}' not found.")

@mcp.tool()
def get_user_rule(title: str) -> TextContent:
    rules_dir = USER_RULES_DIR
    service = RuleService(rules_dir)
    rules = service.load_rules()
    title_norm = title.strip().lower().replace("_", "-")
    for rule in rules:
        if title_norm == rule.key.lower():
            return TextContent(type="text", text=rule.body)
    return TextContent(type="text", text=f"Rule '{title}' not found.")

@mcp.tool()
def list_rule_categories() -> list[TextContent]:
    """List all rule categories and their types for better organization understanding"""
    rules_dir = RULES_DIR
    result = []
    
    # System rules
    system_dir = rules_dir / "system"
    if system_dir.exists():
        system_rules = read_rule_files_with_headers_recursive(system_dir)
        result.append(TextContent(type="text", text="=== SYSTEM RULES (Always Applied) ==="))
        for rule in system_rules:
            rule_type = get_rule_type(rule["header"])
            key = rule["file"].stem.replace("_", "-")
            result.append(TextContent(type="text", text=f"- {key} ({rule_type})"))
    
    # User rules by category
    user_dir = rules_dir / "user"
    if user_dir.exists():
        user_rules = read_user_rule_files_with_headers_recursive(user_dir)
        
        # Group by directory/category
        categories = {}
        for rule in user_rules:
            category = rule["file"].parent.name if rule["file"].parent != user_dir else "root"
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

def main():
    logger.info("========================================")
    logger.info("  Common Rules MCP Server (Python)")
    logger.info("========================================")
    logger.info("Server: common-rules-server")
    logger.info("")
    logger.info("MCP server is running.")
    logger.info("- Use an MCP-compatible client, IDE, or Cursor to connect.")
    logger.info("- Exposes tools: get_system_rules, get_user_rules, get_system_rule, get_user_rule, list_rule_categories")
    logger.info("- Place rules in src/common_rules_server/resources/rules/system/ and user/ with subdirectories")
    logger.info("- Supports subfolders for better organization")
    logger.info("")
    logger.info("For SDK details: https://github.com/modelcontextprotocol/python-sdk")
    logger.info("========================================")
    mcp.run()

if __name__ == "__main__":
    main()