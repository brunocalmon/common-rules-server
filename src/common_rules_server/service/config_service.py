import os
from pathlib import Path
from typing import Dict, Any

class ConfigService:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())
        self.env_file = self.project_root / ".common-rules-mcp.env"
        
        self.defaults = {
            "BUILD_SYSTEM": "unknown",
            "PROJECT_LANGUAGE": "unknown",
            "README_PATH": "README.md",
            "WIKI_DIR": ".docs",
            "DOCS_PROTOCOL": ".docs/template/DOCUMENTATION-PROTOCOL.md",
            "BUILD_COMMAND": "",
            "TEST_COMMAND": "",
            "COVERAGE_THRESHOLD": "80",
            "ENABLE_NOTEBOOKS": "false",
            "NOTEBOOK_DIR": "./notebook/",
            "ENABLE_DAILY_LOGBOOK": "false",
            "ENABLE_DEVIATION": "false",
            "ENABLE_COMPLIANCE": "false",
            "RESOURCES_DIR": ".common-rules/"
        }
        
    def _parse_env_file(self) -> Dict[str, str]:
        config = {}
        if not self.env_file.exists():
            return config
            
        with open(self.env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, val = line.split('=', 1)
                    config[key.strip()] = val.strip()
        return config

    def _auto_detect(self) -> Dict[str, str]:
        detected = {}
        
        # Detect build system and language
        if (self.project_root / "package.json").exists():
            detected["BUILD_SYSTEM"] = "npm"
            detected["PROJECT_LANGUAGE"] = "typescript" # heuristic
        elif (self.project_root / "pyproject.toml").exists() or (self.project_root / "requirements.txt").exists():
            detected["BUILD_SYSTEM"] = "python"
            detected["PROJECT_LANGUAGE"] = "python"
        elif (self.project_root / "Cargo.toml").exists():
            detected["BUILD_SYSTEM"] = "cargo"
            detected["PROJECT_LANGUAGE"] = "rust"
        elif (self.project_root / "build.gradle").exists():
            detected["BUILD_SYSTEM"] = "gradle"
            detected["PROJECT_LANGUAGE"] = "java"
            
        return detected

    def get_config(self) -> Dict[str, Any]:
        """Loads config with priority: .env > auto-detect > defaults"""
        final_config = self.defaults.copy()
        
        auto_detected = self._auto_detect()
        final_config.update(auto_detected)
        
        file_config = self._parse_env_file()
        final_config.update({k: v for k, v in file_config.items() if v}) # Only override if value is not empty
        
        return {
            "config": final_config,
            "env_status": {
                "file_exists": self.env_file.exists(),
                "file_path": str(self.env_file),
                "auto_detected": auto_detected
            }
        }
