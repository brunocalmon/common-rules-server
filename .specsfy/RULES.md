# Regras do projeto

Regras confirmadas pela pessoa responsável. Cada uma registra o motivo, porque
uma regra cujo propósito se perdeu vira ritual.

## Instalação sem scripts de ciclo de vida

Toda instalação de dependência usa `--ignore-scripts`.

**Por quê.** Script de ciclo de vida executa código de terceiros durante a
instalação, antes de qualquer revisão. A documentação do próprio `pi` recomenda
o flag, o que indica que os autores não tratam esses scripts como inócuos.

**Alcance.** `npm install`, `npm ci` e o script `verify`. Se alguma dependência
vier a exigir build nativo, a falha aparece explicitamente em vez de executar em
silêncio, e a decisão volta a ser humana.

## Nada é instalado no ambiente global

Esta ferramenta nunca instala no sistema. Verifica, relata e, quando pedida
explicitamente, cria cópias dentro do projeto.

**Por quê.** O ambiente de destino é gerido de forma declarativa por um
playbook, cuja regra é que nada se instala manualmente. Uma ferramenta que
instalasse por conta própria disputaria com a única fonte da verdade do
ambiente em vez de informá-la.

**Alcance.** Vale para as três camadas de dependência descritas em
`.specsfy/STACK.md`. `uv tool install` escreve em `~/.local/share/uv/tools/`,
fora do projeto, e por isso não é usado.

## Preferir a cópia local, aceitar a global

As dependências do projeto são resolvidas primeiro na cópia local e, na
ausência dela, na global. A origem resolvida é sempre relatada.

**Por quê.** Fixar versão só garante alguma coisa quando o binário executado é o
do projeto. Sem o relato da origem, duas máquinas divergem em silêncio.

## Compilação não deixa artefato quando falha

`tsconfig.json` declara `noEmitOnError`.

**Por quê.** Sem isso o `tsc` emite `dist/` mesmo reprovando por tipo, e a
asserção que verifica a existência do binário passaria sobre uma compilação
quebrada.

## Numeração de identificadores por faixa de spec

Cada spec numera seus `US`, `FR`, `NFR` e `AC` a partir de uma faixa própria, em
blocos de vinte: a SPEC-0005 começa em 020, a SPEC-0006 em 040, e assim por
diante. Nenhuma spec nova recomeça em 001.

**Por quê.** `check_traceability.mjs` varre `tests/` inteiro sem saber a que
spec pertence cada marcador `SPECSFY:`. Quando duas specs usam `FR-001`, os
marcadores de uma aparecem como órfãos para a outra. Com quatro specs
compartilhando numeração, as quatro checagens de trace do `verify_repo`
reprovam, sem que exista falta de cobertura real em nenhuma delas.

**Alcance.** Vale para specs criadas a partir da SPEC-0005. As quatro
concluídas permanecem como estão: renumerá-las reabriria gates de trabalho
aceito, e a regra existe para impedir que o problema cresça, não para desfazer
o passado. A correção de fato pertence ao `@promovaweb/specsfy`, que é dono do
auditor; editá-lo aqui violaria a imutabilidade do upstream e seria desfeito no
próximo `specsfy install`.

## Layout de artefatos-fonte do setup

- Todo arquivo que serve de base/template/import para o setup levar a um projeto-alvo vive sob resources/ na raiz do pacote: resources/hooks/*.md (hooks empacotados), resources/skills/<nome>/ (skills locais autoradas neste pacote, distintas de mattpocock/specsfy, que vêm de fora via installSkills). Nunca soltar esses artefatos direto na raiz do projeto (hooks/, skills/).

## Nomenclatura de skills locais

- Toda skill local autorada por este pacote (não vinda de mattpocock/skills nem de promovaweb/specsfy) usa o prefixo common-rules-<nome-do-artefato>, mesmo padrão do specsfy-<nome>, para nunca colidir dentro de .claude/skills/ ou .agents/skills/ de quem instala.

## Idioma padrão de código e artefatos

- src/**/*.ts, tests/**/*.ts, comentários, identificadores e artefatos empacotados pelo common-rules (skills locais, textos de CLI) são em inglês. Exceção técnica confirmada: specs/**/*.md permanecem em português, porque os scripts validadores do framework Specsfy (ferramenta externa, .agents/skills/specsfy-*/scripts/*.mjs) têm hardcoded títulos de seção e frases em português (ex.: validate_spec.mjs, verify_acceptance.mjs) — traduzir as specs quebraria a esteira de validação inteira. .specsfy/Spec.md também não é traduzido: é publicado pela própria ferramenta Specsfy, não por este projeto. The same exception covers the managed block of docs/**/*.md (between <!-- specsfy:documentator:start --> and --end -->): build_documentation.mjs (also external, .agents/skills/specsfy-documentator/scripts/) hardcodes Portuguese prose in the titles it generates (e.g. "Documentação técnica", "Arquitetura", "Testes") and its --check mode fails ("Documentação desatualizada") if the content diverges from what the generator itself produces — the same class of rigid dependency as specs/*.md. Human content in docs/ outside that managed block stays free to be English. Confirmed in SPEC-0012 (specs/completed/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md, DEC-005) via direct reading of the script.

## Estrutura de pastas do projeto

- src/ (código de produção), tests/ (testes, nomeados por cenário/AC, sem espelhar 1:1 a árvore de src/) e resources/ (artefatos-fonte que o setup entrega ao projeto-alvo) são irmãos na raiz do pacote, nunca aninhados um dentro do outro. Confirmado explicitamente após revisão de quatro opções: o aninhamento estilo Java Maven (src/main/{src,resources} + src/test/{src,resources}) não tem adoção real no ecossistema TypeScript/Node e não é usado aqui.
