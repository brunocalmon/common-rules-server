from mcp.types import TextContent

class Rule:
    def __init__(self, key, header, body, file):
        self.key = key
        self.header = header
        self.body = body
        self.file = file

    def to_text_content(self):
        raise NotImplementedError

class AlwaysRule(Rule):
    def to_text_content(self):
        # Always rules: return key and full content
        return TextContent(type="text", text=f"{self.key}:\n{self.body}")

class AgentRequestedRule(Rule):
    def to_text_content(self):
        desc = self.header.get("description", "").strip()
        return TextContent(type="text", text=f"{self.key}: {desc}")

class AutoAttachedRule(Rule):
    def to_text_content(self):
        globs = self.header.get("globs", "").strip()
        return TextContent(type="text", text=f"{self.key}: The rule is auto-attached when files matching the pattern are referenced or edited. [globs: {globs}]")

class ManualRule(Rule):
    def to_text_content(self):
        # Manual rules: just return the key since they don't have descriptions
        return TextContent(type="text", text=self.key)

class RuleFactory:
    @staticmethod
    def from_header(key, header, body, file):
        # Only create a rule if both description and type are present
        description = str(header.get("description", "")).strip()
        rule_type = str(header.get("type", "")).strip().lower()
        globs = str(header.get("globs", "")).strip()
        if not description or not rule_type:
            return None
        if rule_type == "always":
            return AlwaysRule(key, header, body, file)
        if rule_type == "auto attached":
            return AutoAttachedRule(key, header, body, file)
        if rule_type == "agent requested":
            return AgentRequestedRule(key, header, body, file)
        return ManualRule(key, header, body, file) 