# O comando de terminal é síncrono e não lê entrada — 2026-08-29

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | Código deste repositório, no commit `5179928` |
| Método | Varredura de `src/` e leitura do despacho em `src/cli.ts` |
| Data | 2026-08-29 |
| Natureza | Observação interna |

## Observação

Duas propriedades da superfície atual restringem esta fatia.

**Não há entrada interativa.** A varredura por `stdin`, `readline`, `prompt`,
`question` e `isTTY` em `src/` não devolve ocorrência alguma. O comando produz
saída e encerra; nada é lido de quem o executa.

**O despacho é síncrono.** `run(args)` resolve o nome do comando e devolve
`CommandOutcome` diretamente, sem promessa. Os comandos registrados não recebem
argumentos. A suíte inteira, com 232 casos, depende dessa forma.

## O plano que já existe

`runSetup` aceita `dryRun` e devolve `planned`, uma lista com nome, destino e
evento de cada hook que seria instalado. Quando `dryRun` é verdadeiro, nada é
escrito e o relato diz que seria um ensaio.

Isto é, o objeto que esta fatia precisa submeter à aprovação já existe e já é
produzido sem efeito colateral. A fatia não precisa inventar um plano.

## Consequência

Tornar o despacho assíncrono para acomodar leitura interativa alcançaria os 232
casos existentes. A alternativa é a mesma que as fatias anteriores adotaram para
ambiente, executor, relógio e gerador: injetar a fonte da decisão por interface,
com implementações reais como padrão, mantendo a chamada síncrona.
