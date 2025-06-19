import re

def parse_yaml_header_and_body(text):
    try:
        import yaml
    except ImportError:
        return None, None
    m = re.match(r"```yaml\n(.*?)```\n(.*)", text, re.DOTALL)
    if not m:
        m = re.match(r"---\n(.*?)---\n(.*)", text, re.DOTALL)
    if m:
        header = yaml.safe_load(m.group(1))
        body = m.group(2).lstrip()
        # Enforce required fields
        if not header or not header.get('description') or not header.get('type'):
            return None, None
        # Ensure artifacts field exists and is a list
        if 'artifacts' not in header or header['artifacts'] is None:
            header['artifacts'] = []
        elif not isinstance(header['artifacts'], list):
            header['artifacts'] = [header['artifacts']]
        return header, body
    return None, None 