# System Design: Common Rules MCP

[🏠 Wiki Hub](../README.md)

## 1. Unified Resource Format
YAML Frontmatter padrão para todos os arquivos em `.common-rules/`:
```yaml
---
kind: rule | skill | agent | workflow | loop
name: id-do-recurso
description: O que isso faz
---
```

## 2. API Contract
O MCP expõe:
- `get_context()`: Lista metadados.
- `get_resource(kind, name)`: Lê corpo do markdown.
- `create_resource(kind, name, ...)`: Escreve no disco.
- `setup_config()`: Auto-detecta variáveis em `.common-rules-mcp.env`.
