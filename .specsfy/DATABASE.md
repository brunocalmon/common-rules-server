# Banco de dados

## Fontes de dados

Nenhuma. `common-rules` não tem persistência própria — não abre conexão de
banco, não define schema, não roda migration.

O único estado gravado em disco é `.common-rules/install.json`
(`src/setup/record.ts`), um registro plano do que o `setup` instalou, lido de
volta para idempotência — não uma fonte de dados no sentido deste documento.

## Sobre `src/models/`

`src/models/` (`capacity.ts`, `ollama.ts`, `recommend.ts`, SPEC-0009) nomeia
seleção de **modelo de linguagem** — qual backend de agente e qual modelo
local do `ollama` recomendar — não modelo de dados. O diretório colide de
nome com convenção de ORM o bastante para acionar falso positivo em
`monitor_context.mjs`; este arquivo existe para resolver essa colisão de uma
vez, e não porque este projeto ganhou persistência.

`docs/database.md` confirma a mesma ausência, reconstruído a partir do
código real.
