# Invocação sem interação por backend, verificada na máquina real em 2026-08-30

Todos os seis backends candidatos estão presentes nesta máquina (`which` resolve os seis). Presença não é capacidade (`DEC-002`, SPEC-0002): a pergunta é se cada um expõe uma forma de rodar sem terminal interativo, consumível por um subprocesso.

## Suportados

| Backend | Versão | Flag/subcomando | Saída estruturada |
| --- | --- | --- | --- |
| `pi` | 0.84.3 | `--print`, `-p` | `--mode json` |
| `agy` | 1.1.20 | `--print`, `-p` (alias `--prompt`) | `--output-format json` |
| `claude` | 2.1.251 | `-p`, `--print` | `--output-format json` |
| `codex` | codex-cli 0.151.0 | subcomando `exec` (não é flag do binário raiz) | `--json` (eventos JSONL), `--output-schema <file>` |
| `goose` | 1.47.0 | subcomando `run`, com `-t <texto>` ou `-i <arquivo>`/stdin | `--output-format json` (também `stream-json`) |

`codex exec` foi exercitado de ponta a ponta: `echo "diga apenas OK" | codex exec --sandbox read-only`, sem abrir sessão interativa, imprimiu a resposta do modelo e encerrou sozinho, código de saída 0. `goose run -t "diga apenas OK" --output-format json` teve a mesma forma de invocação — não abriu prompt interativo — e falhou com `error: No model configured. Run 'goose configure' first.`: falta de credencial, não exigência de interação. A distinção entre "capaz de invocação sem interação" e "pronto para responder" é a mesma que já vale para os outros três: `pi`/`agy`/`claude` também falhariam sem chave de API configurada.

## Não suportado

| Backend | Versão | Observação |
| --- | --- | --- |
| `dsh` | 0.1.1-rc.1 | `--help` de topo não expõe modo de execução não interativo; é um bootloader de perfis (`--profile`), não um agente de codificação por si. Sem subcomando equivalente a `exec`/`run`/`--print` encontrado na varredura. |

## Consequência para a fatia

A varredura anterior (backlog, 2026-08-29) checou só o `--help` de topo e concluiu que `codex` e `goose` não tinham forma equivalente — verdadeiro para o `--help` de topo, falso para os subcomandos `exec` e `run`. A lista suportada corrigida é `pi`, `agy`, `claude`, `codex`, `goose` — cinco.

O detector não deve reimplementar a varredura de `--help` em tempo de execução: a forma de invocação sem interação de cada backend é conhecimento fixado nesta pesquisa, não descoberta dinâmica — a mesma lição da fatia 1h sobre parsing frágil de saída de terceiro. Detecção em produção verifica presença (`which`) dos cinco nomes conhecidos; a "capacidade" já foi demonstrada aqui, uma vez, por execução real, e vira dado fixo no código, não sondagem repetida.
