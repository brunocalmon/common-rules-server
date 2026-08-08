import asyncio
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from mcp.types import TextContent
import sys
import logging
import os
import yaml

from common_rules_server.service.config_service import ConfigService
from common_rules_server.service.resource_service import ResourceService
from common_rules_server.service.bdd_service import BddService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("common-rules-mcp")

mcp = FastMCP("common-rules")

# Initialize services lazily inside tools to ensure they pick up CWD at runtime,
# but we can initialize them globally since the server runs in the CWD anyway.
config_service = ConfigService()
resource_service = ResourceService(config_service)
bdd_service = BddService()

@mcp.tool()
def get_context() -> list[dict]:
    """
    Returns the metadata (progressive disclosure) of all available resources.
    Use this to understand what skills, workflows, loops and agents exist.
    """
    return resource_service.get_context()

@mcp.tool()
def get_resource(kind: str, name: str) -> dict:
    """
    Reads the full parsed resource including frontmatter, body, and resolved env.
    """
    res = resource_service.get_resource(kind, name)
    if not res:
        return {"error": f"Resource {kind}:{name} not found."}
    return res

@mcp.tool()
def create_resource(kind: str, name: str, description: str, body: str) -> str:
    """
    Creates or updates a new resource in the user's workspace.
    """
    user_dir = resource_service.user_dir
    user_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = user_dir / f"{name}.md"
    
    header = {
        "kind": kind,
        "name": name,
        "description": description,
        "relationships": {},
        "env": {"requires": [], "optional": []}
    }
    
    content = f"---\n{yaml.safe_dump(header, sort_keys=False)}---\n{body}"
    file_path.write_text(content, encoding="utf-8")
    
    return f"Created {kind} {name} at {file_path}"

@mcp.tool()
def setup_config() -> dict:
    """
    Auto-detects project settings and initializes .common-rules-server.
    Also detects the IDE, injects global rules, and injects mandatory MCP servers.
    """
    from common_rules_server.service.ide_service import IdeService
    from common_rules_server.service.mcp_installer_service import McpInstallerService
    
    ide_service = IdeService()
    mcp_installer_service = McpInstallerService()
    
    config_result = config_service.write_config()
    ide_result = ide_service.setup_ide_rules()
    mcp_result = mcp_installer_service.inject_mcps()
    
    return {
        "config": config_result["config"],
        "env_status": config_result["env_status"],
        "ide_rules": ide_result,
        "mcp_injection": mcp_result,
        "message": "Dynamic initialization and hooks executed successfully."
    }

@mcp.tool()
def get_bdd_scenario(page: int = 1) -> dict:
    """
    Reads the agent_bdd.feature file from the project root and returns
    one Gherkin scenario at a time, paginated.

    Page 1 returns the first scenario, page 2 the second, etc.
    The agent should call this in a loop, incrementing page until
    has_next is false.

    Returns: { scenario: { name, body }, page, total_pages, has_next }
    """
    return bdd_service.get_scenario(page)

def main():
    logger.info("========================================")
    logger.info("  Common Rules MCP (AntiGravity V2)")
    logger.info("========================================")
    logger.info("Server is running.")
    logger.info("- Exposes tools: get_context, get_resource, create_resource, setup_config, get_bdd_scenario")
    logger.info("========================================")
    mcp.run()

if __name__ == "__main__":
    main()