from pathlib import Path
from typing import List, Dict, Any, Optional
from common_rules_server.util.resource_parsing import parse_resource_file
from common_rules_server.service.config_service import ConfigService
import logging

logger = logging.getLogger(__name__)

class ResourceService:
    def __init__(self, config_service: ConfigService, built_in_dir: str = None):
        self.config_service = config_service
        self.config = self.config_service.get_config()["config"]
        
        # User dir from config
        self.user_dir = Path(self.config_service.project_root) / self.config.get("RESOURCES_DIR", ".common-rules/")
        
        # Built-in dir
        if built_in_dir:
            self.built_in_dir = Path(built_in_dir)
        else:
            self.built_in_dir = Path(__file__).parent.parent / "resources"

    def _get_files(self, directory: Path) -> List[Path]:
        if not directory.exists() or not directory.is_dir():
            return []
        return list(directory.rglob("*.md"))

    def _replace_placeholders(self, text: str) -> str:
        for key, val in self.config.items():
            placeholder = f"{{{{ {key} }}}}"
            if placeholder in text:
                text = text.replace(placeholder, str(val))
            
            # Also support standard bash-like env vars in some contexts if needed,
            # but template mustache {{ VAR }} is standard for this MCP playbook.
            
        return text

    def load_resources(self) -> Dict[str, Dict[str, Any]]:
        """Loads all resources, user overriding built-in by kind:name"""
        resources = {}
        
        # Load built-ins first
        built_in_files = self._get_files(self.built_in_dir)
        for f in built_in_files:
            res = self._parse_file(f)
            if res:
                key = f"{res['kind']}:{res['name']}"
                res['source'] = 'built-in'
                resources[key] = res
                
        # Load user resources (overrides)
        user_files = self._get_files(self.user_dir)
        for f in user_files:
            res = self._parse_file(f)
            if res:
                key = f"{res['kind']}:{res['name']}"
                res['source'] = 'user'
                resources[key] = res
                
        return resources

    def _parse_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        try:
            text = file_path.read_text(encoding="utf-8")
            header, body = parse_resource_file(text)
            if not header:
                return None
            
            # Apply placeholder replacements in the body
            body = self._replace_placeholders(body)
            
            parsed = header.copy()
            parsed["body"] = body
            parsed["file"] = str(file_path)
            
            return parsed
        except ValueError as e:
            logger.warning(f"Skipping {file_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error loading resource {file_path}: {e}")
            return None

    def get_context(self) -> List[Dict[str, Any]]:
        """Returns only metadata of all resources (progressive disclosure)"""
        resources = self.load_resources()
        context = []
        for key, res in resources.items():
            context.append({
                "kind": res["kind"],
                "name": res["name"],
                "description": res.get("description", ""),
                "relationships": res.get("relationships", {}),
                "source": res["source"]
            })
        return context

    def get_resource(self, kind: str, name: str) -> Optional[Dict[str, Any]]:
        resources = self.load_resources()
        key = f"{kind}:{name}"
        return resources.get(key)
