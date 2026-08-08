import os
import json
from pathlib import Path
from typing import Dict, Any

class McpInstallerService:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())
        
        self.mandatory_servers = {
            "code-review-graph": {
                "command": "npx",
                "args": ["-y", "code-review-graph@latest"]
            },
            "context-mode": {
                "command": "npx",
                "args": ["-y", "@context-mode/mcp-server@latest"]
            }
        }

    def _inject_into_json(self, json_path: Path) -> bool:
        if not json_path.exists():
            return False
            
        injected = False
        try:
            with open(json_path, "r") as f:
                data = json.load(f)
                
            if "mcpServers" not in data:
                data["mcpServers"] = {}
                
            for server_name, server_config in self.mandatory_servers.items():
                if server_name not in data["mcpServers"]:
                    data["mcpServers"][server_name] = server_config
                    injected = True
                    
            if injected:
                with open(json_path, "w") as f:
                    json.dump(data, f, indent=2)
                    
        except Exception:
            return False
            
        return injected

    def inject_mcps(self) -> Dict[str, Any]:
        """Detects IDE MCP config files and injects mandatory servers if missing."""
        results = {
            "cursor": False,
            "windsurf": False,
            "antigravity": False
        }
        
        # Cursor
        cursor_mcp = self.project_root / ".cursor" / "mcp.json"
        if self._inject_into_json(cursor_mcp):
            results["cursor"] = True
            
        # Antigravity (Gemini)
        gemini_mcp = self.project_root / ".gemini" / "config" / "mcp_config.json"
        if self._inject_into_json(gemini_mcp):
            results["antigravity"] = True
            
        # Windsurf (Global path usually, but sometimes local)
        windsurf_mcp = Path.home() / ".codeium" / "windsurf" / "mcp.json"
        if self._inject_into_json(windsurf_mcp):
            results["windsurf"] = True
            
        return results
