# "Análise completa" de modelo exige rede e autenticação por backend

Data: 2026-08-30. Verificação real, nesta máquina.

## O que a ideia original pedia

"Orchestrator model selection: análise completa (disponíveis via ollama ls etc, custo, capacidade máquina, plan usage Claude, recomendação + user override)."

## O que é local e real

```bash
$ ollama list
NAME          ID              SIZE      MODIFIED
cogito:14b    d0cac86a2347    9.0 GB    3 days ago
qwen2.5:3b    357c53fb659c    1.9 GB    3 days ago
qwen3:8b      500a1f067a9f    5.2 GB    4 days ago
```

Sem rede, sem autenticação — `ollama` serve um endpoint local (`127.0.0.1:11434` por padrão) e `list` lê do disco.

```js
os.totalmem()  // 15.9 GB nesta máquina
os.freemem()   // 4.8 GB livres no momento da verificação
os.cpus().length // 16
```

Nativo do Node, sem subprocesso.

## O que exige rede/autenticação, verificado por execução real

- `agy models` → `Error: Please sign in to view available models. Launch the CLI without arguments to sign in.` Pedido de login antes de listar qualquer modelo.
- `claude --help`, `pi --help`, `codex --help` (`-m`/`--model`) e `agy --help` (`--model`) declaram a flag de modelo como **texto livre** (padrão ou ID), nunca uma lista fechada que o `--help` enumere. `pi --help` cita exemplos (`sonnet:high`, `gpt-4o-mini`) como demonstração de sintaxe, não como inventário do que está disponível para a conta autenticada.
- `goose` tem `local-models`/`lm` para modelos locais (fora do escopo desta fatia, que já cobre local via `ollama`) e nenhum subcomando de listagem para os modelos de nuvem da conta.
- Nenhum dos cinco backends suportados expõe, sem autenticação, uso de plano ou custo — `claude --help` não tem opção de billing/uso; a mesma ausência vale para os outros quatro.

## Consequência para o plano

Enumerar modelo de nuvem, custo e uso de plano exigiria rede e login por backend — contradiz `DEC-002` (SPEC-0002) e `NFR-030` (SPEC-0008), que mantêm o projeto inteiro sem chamada de rede e sem prompt de autenticação. A fatia 1e entrega o que é verificável sem isso: modelos locais via `ollama`, capacidade da máquina, e uma recomendação de **backend** (da lista suportada da fatia 1d) mais, quando aplicável, de **modelo local**. Escolha de modelo de nuvem dentro de um backend permanece com o próprio backend.
