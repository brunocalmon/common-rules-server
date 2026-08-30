# Segunda origem oficial: `promovaweb/specsfy` pelo mesmo instalador `skills`

Data: 2026-08-30. Execução real, sem fixture, em diretório descartável.

## Comando

```bash
skills add promovaweb/specsfy -a claude-code --skill '*' --copy -y
```

## Resultado

- Código de saída: 0.
- `.claude/skills/` recebeu 20 diretórios (`specsfy-01-inbox` … `specsfy-update-spec`), todos arquivo real — `find .claude/skills -maxdepth 1 -type l` não encontrou link algum.
- `skills-lock.json` gravado na raiz, mesma forma do instalador para `mattpocock/skills`: `{"version":1,"skills":{"<nome>":{"source","sourceType","skillPath","computedHash"}}}`.
- O atalho curto `promovaweb/specsfy` (sem URL completa) funciona igual a `https://github.com/promovaweb/specsfy`, no mesmo formato `owner/repo` já usado por `mattpocock/skills`.
- Nenhum `CLAUDE.md` nem `AGENTS.md` foi criado por este comando — só `.claude/skills/` e o lockfile.

## Consequência para o plano

`src/skills/source.ts` aceita hoje uma única origem oficial. A segunda origem entra pelo mesmo `Executor`/`installSkills` já desenhados; o único ajuste é `resolveSource` aceitar as duas, e `runSetup` chamar `installSkills` uma vez por origem.
