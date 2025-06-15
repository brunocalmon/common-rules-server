from pathlib import Path
from common_rules_server.domain.rule import RuleFactory
from common_rules_server.util.rule_parsing import parse_mdc_header_and_body, parse_yaml_header_and_body

class RuleService:
    def __init__(self, rules_dir):
        self.rules_dir = Path(rules_dir)

    def load_rules(self):
        rules = []
        for ext in ("*.md", "*.mdc"):
            for file in sorted(self.rules_dir.rglob(ext)):
                try:
                    text = file.read_text(encoding="utf-8")
                    if file.suffix == ".mdc":
                        header, body = parse_mdc_header_and_body(text)
                    else:
                        header, body = parse_yaml_header_and_body(text)
                    key = file.stem.replace("_", "-")
                    rule = RuleFactory.from_header(key, header, body, file)
                    rules.append(rule)
                except Exception as e:
                    print(f"Error loading rule {file}: {e}")
        return rules

    def get_user_rules(self, rule_name=None):
        rules = self.load_rules()
        result = []
        for rule in rules:
            if rule_name and rule_name.lower() not in rule.key.lower():
                continue
            result.append(rule.to_text_content())
        return result 