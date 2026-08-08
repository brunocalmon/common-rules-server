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

@mcp.tool()
def get_context() -> list[dict]:
    """
    Returns the metadata (progressive disclosure) of all available resources.
    Use this to understand what skills, workflows, loops and agents exist.
    """
    return resource_service.get_context()

@mcp.tool()
def get_resource(kind: str, name: str) -> str:
    """
    Reads the full body of a specific resource.
    """
    res = resource_service.get_resource(kind, name)
    if not res:
        return f"Resource {kind}:{name} not found."
    return res["body"]

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
    Auto-detects project settings and reads .common-rules-mcp.env.
    Returns the configuration and environment status.
    """
    return config_service.get_config()

def main():
    logger.info("========================================")
    logger.info("  Common Rules MCP (AntiGravity V2)")
    logger.info("========================================")
    logger.info("Server is running.")
    logger.info("- Exposes tools: get_context, get_resource, create_resource, setup_config")
    logger.info("========================================")
    mcp.run()

if __name__ == "__main__":
    main()