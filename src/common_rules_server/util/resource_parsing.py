import re

def parse_resource_file(text):
    """
    Parses a markdown resource file with YAML frontmatter.
    
    Returns a tuple of (header_dict, body_str) if valid, or (None, None) if invalid.
    """
    try:
        import yaml
    except ImportError:
        return None, None

    # Unified format requires --- at the start
    m = re.match(r"^---\n(.*?)---\n?(.*)", text, re.DOTALL)
    if not m:
        return None, None

    try:
        header = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None, None

    if not header or not isinstance(header, dict):
        return None, None

    # Enforce required fields for all kinds
    if not header.get('kind') or not header.get('name') or not header.get('description'):
        return None, None

    body = m.group(2).lstrip()

    # Ensure relationships and env have safe defaults
    if 'relationships' not in header or header['relationships'] is None:
        header['relationships'] = {}
    
    if 'env' not in header or header['env'] is None:
        header['env'] = {'requires': [], 'optional': []}
    else:
        if 'requires' not in header['env'] or header['env']['requires'] is None:
            header['env']['requires'] = []
        if 'optional' not in header['env'] or header['env']['optional'] is None:
            header['env']['optional'] = []

    return header, body
