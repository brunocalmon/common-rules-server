import re

def parse_mdc_header_and_body(text):
    header = {}
    body = text
    m = re.match(r"---\n(.*?)---\n(.*)", text, re.DOTALL)
    if m:
        header_block = m.group(1)
        body = m.group(2).lstrip()
        for line in header_block.splitlines():
            if ':' in line:
                k, v = line.split(':', 1)
                header[k.strip()] = v.strip()
    return header, body

# Helper to parse YAML header and content from a .md rule file
def parse_yaml_header_and_body(text):
    try:
        import yaml
    except ImportError:
        return {}, text
    m = re.match(r"---\n(.*?)---\n(.*)", text, re.DOTALL)
    if m:
        header = yaml.safe_load(m.group(1))
        body = m.group(2).lstrip()
        return header or {}, body
    return {}, text 