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
