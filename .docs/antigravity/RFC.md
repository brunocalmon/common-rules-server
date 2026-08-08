# RFC: Technical Architecture

[🏠 Wiki Hub](README.md) · [Usage](USAGE.md) · [PRD](PRD.md) · [KPI](KPI.md) · [Milestones](MILESTONES.md) · [Protocol](DOCUMENTATION-PROTOCOL.md) · [Tracker](tracking/ROADMAP.md)

> **Ground truth.** Arquitetura técnica e contratos do Common Rules MCP.

## 1. Unified Resource Format

Todos os recursos compartilham o mesmo schema de frontmatter YAML:

```yaml
---
kind: rule | skill | agent | workflow | loop
name: kebab-case-id
description: One-line summary
relationships:
  comes-from: [...]
  goes-to: [...]
  can-invoke: [...]
env:
  requires: [...]
  optional: [...]
---
```

## 2. API Contract

O servidor MCP expõe as seguintes 4 tools unificadas:

1. `get_context()`: Retorna o mapa de recursos completo (só metadados).
2. `get_resource(kind, name)`: Retorna o body completo de um recurso específico.
3. `create_resource(...)`: Ferramenta para dinamicamente criar novos recursos no `$PROJECT_ROOT/.common-rules/`.
4. `setup_config()`: Gera/valida `.common-rules-mcp.env` auto-detectando valores.

## 3. Sistema de Configuração

- Local: `$PROJECT_ROOT/.common-rules-mcp.env`
- Resolução de valores: `.env` (Explícito) > Auto-detect (Linguagem/Build) > Defaults.
- Exemplo de variáveis suportadas: `BUILD_COMMAND`, `TEST_COMMAND`, `README_PATH`.

## 4. Estrutura de Diretórios

O servidor carragará os built-in defaults de `src/common_rules_server/resources/` e permitirá overrrides a nível de projeto em `$PROJECT_ROOT/.common-rules/`.

---
## Document impact
**This document impacts** — nothing yet.
**This document is impacted by** — nothing yet.
