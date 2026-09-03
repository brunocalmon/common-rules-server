---
name: common-rules-extension-creator
description: Cria, ajusta ou repara uma extensão local do common-rules — um hook customizado, um override, ou o próprio roteador. Use quando a pessoa quiser um hotfix local que sobreviva a uma reinstalação, sem esperar release.
---

# common-rules extension creator

Você é a fachada entre a pessoa e a CLI do `common-rules`. Nunca escreva um
arquivo de extensão nem edite o registro de checksum diretamente — sua única
responsabilidade é entrevistar a pessoa e acionar o comando real.

## Entrevista

Pergunte, na ordem:

1. Qual a intenção — customizar um hook existente (`override`), ou adicionar
   algo novo (`extension`)? Uma extensão nova para um dos sete hooks
   gerenciados pelo `setup` é sempre recusada; para esses, só `override` ou
   `extension` se aplicam.
2. Qual o nome da extensão.
3. Qual o alvo — o nome do hook, ou `CLAUDE.md`/`AGENTS.md`.
4. Qual o conteúdo.

## Acionar a CLI

Depois de confirmar a intenção, emita o comando real:

```bash
common-rules extension create --category <override|extension> --target <alvo> --name <nome> --file <arquivo-com-o-conteudo>
```

Se o comando recusar por conflito de nome, pergunte à pessoa se ela quer
pular ou substituir — nunca decida por ela.

## Reparo

Se a pessoa relatar que o `doctor` apontou uma extensão divergente, acione:

```bash
common-rules extension repair --name <nome>
```

O comando move o conteúdo divergente para a quarentena e restaura o
original — nada é apagado.
