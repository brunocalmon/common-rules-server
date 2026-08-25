# Stack do sistema

## Inventário detectado

<!-- specsfy:stack:start -->
| Camada | Tecnologia | Evidência |
| --- | --- | --- |
| Linguagem | TypeScript | `package.json` (`typescript`) |
| Testes | Vitest | `package.json` (`vitest`) |
| Runtime | Node.js | `package.json` |
<!-- specsfy:stack:end -->

## Decisões estruturais e camadas de dependência

Conteúdo humano, fora do bloco reconstruído. Cada linha cita uma fonte executável.

| Camada | Tecnologia | Responsabilidade | Evidência |
| --- | --- | --- | --- |
| Módulo | ESM | Formato de módulo do pacote e da compilação | `package.json` (`"type": "module"`) |
| Ferramenta | `@types/node` 26.3.0 | Tipos do runtime Node para a compilação estrita | `package.json` (`devDependencies`) |
| Runtime | Node maior ou igual a 20 | Versão mínima suportada | `package.json` (`engines.node`) |
| Subsistema npm | `@promovaweb/specsfy` 0.10.2 | Motor de skills e regras do processo | `package.json` (`dependencies`) |
| Subsistema npm | `context-mode` 1.0.169 | Gestão de janela de contexto entre sessões | `package.json` (`dependencies`) |
| Subsistema Python | `code-review-graph` 2.3.7 | Análise de relações de código e call graphs | Exigido do ambiente; instalado por `uv`, ausente do npm |
| Backend de agente | `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh`, Ollama | Execução delegada pelo Orchestrator, em fatia futura | **Nada os detecta hoje**: `src/doctor.ts` cobre apenas as três dependências do projeto. A detecção pertence à fatia 1d, e nenhum deles é dependência declarada |

### Regra de resolução das dependências do projeto

Preferir a cópia local do projeto, aceitar a global quando não houver local, e
nunca instalar no ambiente global. A verificação relata qual origem resolveu,
para que a diferença entre máquinas seja visível em vez de silenciosa.

Fixar versão só garante alguma coisa quando o binário executado é o do projeto.
Ao mesmo tempo, o ambiente de destino é gerido por um playbook declarativo cuja
regra é que nada se instala manualmente, e `uv tool install` escreve fora do
projeto. A ordem local antes de global honra as duas restrições.

### Instalação sem scripts de ciclo de vida

Toda instalação de dependência usa `--ignore-scripts`. Script de ciclo de vida
executa código de terceiros durante a instalação, e a documentação do próprio
`pi` recomenda o flag. O registro canônico da regra fica em `.specsfy/RULES.md`.

### Compilação não deixa artefato quando falha

`tsconfig.json` declara `noEmitOnError`. Sem isso, `tsc` emite `dist/` mesmo com
erro de tipo, e a asserção que verifica a existência do binário passaria sobre
uma compilação quebrada. Verificado por mutação: build com erro sai com código 1
e não cria `dist/`; build limpo sai com zero e cria.

### Hooks empacotados com o produto

Os sete hooks portados da v0.2.8 vivem em `hooks/`, na raiz do pacote, e são
declarados em `files` do manifesto. Não vivem dentro de `specs/`: o caminho de
uma spec muda conforme ela avança de estado, e código que dependesse dele
quebraria a cada transição — como de fato quebrou, com `ENOENT`, ao mover a
SPEC-0003 de `defined` para `in-progress`.

O bloco de código dentro de cada `.md` é fragmento, e não script completo. Ele
lê `HOOK_COMMAND`, `HOOK_FILE` e `HOOK_INPUT`, que o invólucro fornece, e
comunica por `decision` e `message`, que o invólucro emite. Sozinho, o fragmento
de um guard termina no último `fi` sem imprimir nada e não bloquearia coisa
alguma.

### Configuração de hooks, introduzida pela fatia 1b

| Camada | Item | Responsabilidade | Evidência |
| --- | --- | --- | --- |
| Módulo | `src/hooks/source.ts` | Lê frontmatter e fragmento de cada hook | `src/hooks/source.ts` |
| Módulo | `src/hooks/claude-code.ts` | Traduz para o formato do alvo e envolve o fragmento | `src/hooks/claude-code.ts` |
| Módulo | `src/hooks/detect.ts` | Decide se há evidência de uso do alvo | `src/hooks/detect.ts` |
| Módulo | `src/setup/run.ts` | Encadeia detecção, tradução, escrita e registro | `src/setup/run.ts` |
| Módulo | `src/setup/record.ts` | Lê, grava e compara o registro de instalação | `src/setup/record.ts` |
| Módulo | `src/setup/bridge.ts` | Cria a cópia local do subsistema Python | `src/setup/bridge.ts` |
| Módulo | `src/setup/env.ts` | Observa o sistema de arquivos para alimentar a detecção | `src/setup/env.ts` |
| Alvo | Claude Code | Único alvo suportado; Cursor e Antigravity ficam para fatia própria | `src/hooks/detect.ts` |
| Estado | `.common-rules/install.json` | Registro do que foi instalado, dentro do projeto | `src/setup/record.ts` |
| Estado | `.claude/settings.json` | Onde as entradas de hook são escritas | `src/setup/run.ts` |

### Separação entre decidir, traduzir e escrever

Cada uma vive em módulo próprio, e a razão é concreta. A tradução devolve
conteúdo e não escreve, de modo que a fidelidade do fragmento é verificável sem
tocar o disco. Na v0.2.8 escape e escrita estavam no mesmo caminho, o escape foi
consumido duas vezes e todos os guards passaram a permitir tudo — defeito que
sobreviveu à revisão porque o arquivo gerado parecia correto.

Pela mesma razão, `env.ts` é a única parte que observa o sistema de arquivos: a
decisão de detecção recebe o resultado por parâmetro e pode ser exercitada
contra ambientes construídos.
