# Product Requirements Document (PRD)

[🏠 Wiki Hub](README.md) · [Usage](USAGE.md) · [RFC](RFC.md) · [KPI](KPI.md) · [Milestones](MILESTONES.md) · [Protocol](DOCUMENTATION-PROTOCOL.md) · [Tracker](tracking/ROADMAP.md)

> **Ground truth.** Este documento define a visão e os princípios de design do Common Rules MCP.
> Baseado no Rollback Playbook v2.

## 1. Visão do Produto
Transformar um servidor de pseudocódigo de regras em um **MCP de orquestração de desenvolvimento** com regras, skills, agentes, workflows e loops como recursos de primeira classe.

## 2. Princípios de Design

- **Natural language only**: Sem pseudocódigo ou variáveis complexas.
- **Self-aware resources**: Cada recurso sabe sua origem, destino e o que invocar.
- **Progressive disclosure**: API retorna metadados primeiro, e conteúdo apenas sob demanda.
- **One format, many kinds**: Formato YAML unificado.
- **Tool-agnostic**: Não depende de IDE específica.
- **Predictable outputs**: Respostas previsíveis via templates.
- **Rich API, few calls**: Minimização de round-trips via MCP.

## 3. Resource Model

O domínio do MCP é organizado na seguinte hierarquia:

- **Rules**: Primitivas de comportamento, sempre ativas.
  - **Skills**: Ações acionáveis que compõem regras e outras skills.
    - **Workflows**: Sequências orquestradas de skills.
      - **Loops**: Workflows com recorrência/gatilhos temporais.
- **Agents**: Ortogonais. Definem QUEM executa as ferramentas (persona + restrições).

---
## Document impact
**This document impacts** — nothing yet.
**This document is impacted by** — nothing yet.
