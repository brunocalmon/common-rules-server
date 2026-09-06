# Causa raiz: testes de setup sem root isolado

Evidência local para R-001. Todo trecho abaixo é código deste próprio
repositório (`refactor/v1-cli-first`), copiado aqui apenas para ancorar a
claim da spec — não é conteúdo de terceiros.

## Fallback de root em runSetup

`src/setup/run.ts`, linha 227:

```ts
const root = opts.root ?? process.cwd();
```

Quando `opts.root` não é passado, `runSetup` usa `process.cwd()`. Ao rodar
`npx vitest run` a partir da raiz do repositório, `process.cwd()` é o
próprio diretório do repositório.

## Os cinco arquivos que não passam root

Todos chamam `runSetup({ env, write: true, ... })` sem o campo `root`:

- `tests/setup-idempotent.test.ts`: 4 chamadas (`runSetup({ env, write: true })`, `runSetup({ env, write: true, previous: one.record })` × 3).
- `tests/setup-revert.test.ts`: 4 chamadas equivalentes.
- `tests/setup-record.test.ts`: 4 chamadas equivalentes.
- `tests/setup-install.test.ts`: `const run = () => runSetup({ env, write: true, dryRun: false });`, chamada 4 vezes.
- `tests/setup-dryrun.test.ts`: `const dryRun = () => runSetup({ env, write: true, dryRun: true });`, chamada 3 vezes.

Nenhuma dessas 19 chamadas passa `root`, nenhum dos cinco arquivos importa
`mkdtempSync`/`tmpdir`, e nenhuma asserção lê um caminho fora do que
`runSetup` devolve na própria resposta (`.record`, `.settings`, `.installed`,
`.written`, `.planned`, `.bridged`) — confirmando a resposta à dúvida "algum
desses testes depende do cwd real por outro motivo?": não, pela leitura
completa dos cinco arquivos.

## O padrão correto, já em uso no mesmo repositório

`tests/setup-writes.test.ts`, linhas 10–16:

```ts
/** Disposable project, so verification touches disk without touching the real one. */
function project(previousContent?: string): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  if (previousContent !== undefined) writeFileSync(resolve(root, TARGET_SETTINGS), previousContent);
  return root;
}
```

E o uso, linha 22: `runSetup({ env, root, write: true });` — `root` vem do
diretório temporário criado por `project()`, nunca de `process.cwd()`.

## Reprodução

Rodado duas vezes na mesma sessão de trabalho, a partir de um checkout
limpo deste repositório:

1. `git status --porcelain` → vazio.
2. `npx vitest run` (suíte completa) → passa.
3. `git status --porcelain` → `.common-rules/install.json` aparece
   modificado (campos `trace` e `installedAt` de cada hook).
4. `git diff .common-rules/install.json` confirma que apenas esses dois
   campos mudam, com a mesma lista de 7 hooks — consistente com uma
   chamada real a `runSetup({ ..., write: true })` tendo rodado contra o
   próprio repositório.
5. `git checkout -- .common-rules/install.json` restaura o repositório —
   repetido nas duas ocorrências, antes de commitar os fixes reais que
   estavam sendo trabalhados na sessão (`929cad8`, `3831d5d`).
