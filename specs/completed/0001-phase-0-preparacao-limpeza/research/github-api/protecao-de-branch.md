# Consulta à API do GitHub sobre proteção de branch — 2026-08-24

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | API REST do GitHub, via `gh api` |
| Data de acesso | 2026-08-24 |
| Endpoints consultados | `repos/{owner}/{repo}/branches/archived/protection` e `repos/{owner}/{repo}/rules/branches/archived` |
| Licença | Não aplicável; resposta factual sobre o próprio repositório |

## Achado

O primeiro endpoint responde `404 Branch not protected` mesmo quando a branch
está protegida, porque cobre apenas o mecanismo legado. Regras criadas pela
interface atual do GitHub são **rulesets**, e não aparecem ali.

A pergunta "quais regras valem para esta branch" se responde no segundo
endpoint, que reportou duas regras ativas sobre `refs/heads/archived`.

## Configuração verificada

| Campo | Valor |
| --- | --- |
| Ruleset | `protected`, id 21321914 |
| Enforcement | `active` |
| Alvo | `refs/heads/archived` |
| Regras | `deletion`, `non_fast_forward` |
| Atores de bypass | nenhum |

## Impacto na spec

Sustenta o item da Definition of Done que exige `archived` protegida contra
escrita. A primeira verificação do aceite concluiu erroneamente que a branch
não estava protegida, por consultar apenas o endpoint legado; o registro existe
para que a confusão entre os dois mecanismos não se repita.
