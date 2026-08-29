# Como o processo MCP enxerga o projeto — 2026-08-24

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | Processos em execução na máquina de desenvolvimento |
| Método | `ps`, `readlink /proc/<pid>/cwd` e leitura de `/proc/<pid>/environ` |
| Data | 2026-08-24 |
| Natureza | Observação do sistema local; nenhum conteúdo de terceiro reproduzido |

## Observação

Três processos do servidor da v0.2.8 estavam ativos ao mesmo tempo, com
diretórios de trabalho distintos:

| PID | Diretório de trabalho | `CLAUDE_PROJECT_DIR` |
| --- | --- | --- |
| 248091 | `/run/host/home/bcalmon` | ausente |
| 248094 | `/run/host/home/bcalmon` | ausente |
| 255802 | `/home/bcalmon/Projects/dev-bootstrap` | presente |

O projeto em que o trabalho ocorria era `/home/bcalmon/Projects/common-rules-server`,
que **nenhum dos três** tinha como diretório de trabalho.

## Consequência para a fatia

Um servidor MCP não pode derivar a raiz do projeto de `process.cwd()` nem de
variável de ambiente. Dois dos três processos apontavam para o diretório
pessoal, e o único que carregava a variável apontava para outro projeto.

O modo de falha é silencioso e caro: a ferramenta escreveria configuração numa
árvore que a pessoa não pediu, e o relato diria que instalou com sucesso.

Registro anterior da mesma investigação acrescenta que `roots/list` responde,
mas devolve a pasta que **contém** os projetos, e não o projeto. Serve como
pista, não como resposta.

## Decisão que isso sustenta

A tool exige `project_root` explícito e valida que o caminho parece um projeto
antes de escrever. Sem parâmetro válido ela recusa, em vez de adivinhar.
