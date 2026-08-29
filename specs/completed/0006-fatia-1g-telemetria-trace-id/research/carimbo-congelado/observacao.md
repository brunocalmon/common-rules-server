# O carimbo de tempo do registro está congelado — 2026-08-29

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | Código deste repositório, `src/setup/run.ts`, no commit `787b1a5` |
| Método | Leitura do código e avaliação do valor produzido |
| Data | 2026-08-29 |
| Natureza | Observação interna; nenhum conteúdo de terceiro |

## Observação

`runSetup` calcula o momento da instalação uma vez, com `new Date(0)`, e usa
esse valor tanto para as entradas de hook quanto para as de skills. `new Date(0)`
é a época Unix, de modo que o valor gravado é sempre o mesmo instante de 1970,
qualquer que seja o momento real da execução.

O efeito é que `.common-rules/install.json` afirma, em toda máquina e em toda
execução, que a instalação ocorreu em `1970-01-01T00:00:00.000Z`.

## Por que nenhum teste percebe

Duas asserções tocam o campo, e nenhuma o exercita:

| Arquivo | Asserção | O que deixa passar |
| --- | --- | --- |
| `tests/setup-record.test.ts` | `Date.parse(installedAt)` não é `NaN` | A época zero parseia sem erro |
| `tests/skills-registro-persistido.test.ts` | o campo é texto | Qualquer texto passa |

É o mesmo padrão que já apareceu neste repositório: a asserção confirma a forma
do valor e não o seu conteúdo, e por isso um valor constante sobrevive.

## Consequência para esta fatia

Correlacionar operações por identificador exige que o registro diga **quando** e
**qual execução**. Um carimbo congelado torna a correlação inútil, porque duas
execuções distintas ficam indistinguíveis no tempo.

O carimbo provavelmente foi fixado para dar determinismo aos casos. A saída não
é escolher entre determinismo e verdade: é injetar relógio e gerador, com
implementação real como padrão, do mesmo modo que o ambiente já é injetado nas
fatias anteriores.
