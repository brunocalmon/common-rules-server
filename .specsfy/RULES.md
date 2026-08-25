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
