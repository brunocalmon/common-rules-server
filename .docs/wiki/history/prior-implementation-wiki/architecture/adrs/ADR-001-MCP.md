# ADR-001: Migração para MCP (Model Context Protocol)

**Status**: Accepted
**Data**: 2026-08-08

## 1. Contexto
O servidor antigo (pseudo-código) era opaco e forçava os LLMs a interpretar ASTs mal definidos. 

## 2. Decisão
Adotar o padrão MCP, transformando cada "regra" em um recurso recuperável por `get_resource` e gerenciável pela LLM.

## 3. Consequências
- **Positivo**: LLMs podem explorar o contexto iterativamente (`get_context` -> `get_resource`).
- **Negativo**: Requer refatoração massiva do parsing (TKT-001) e do serviço (TKT-003).
