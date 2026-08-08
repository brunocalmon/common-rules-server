# Protocolo de Documentação

[🏠 Wiki Hub](README.md) · [PRD](PRD.md) · [RFC](RFC.md) · [KPI](KPI.md) · [Milestones](MILESTONES.md) · [Usage](USAGE.md)

Como as decisões são registradas, substituídas e navegadas nesta wiki.

## A Regra do Root (Root README as a Hub)

O arquivo `README.md` localizado na raiz (`root`) do repositório deve servir **exclusivamente como um hub ou página inicial de redirecionamento**. Ele não deve conter documentação técnica extensa, detalhes de arquitetura ou tutoriais longos. Todo conteúdo relevante (como `ARCHITECTURE.md`, guias de desenvolvimento, etc.) deve ser integrado nas pastas apropriadas desta Wiki (ex: `engineering/`, `architecture/`). O Root README deve apenas apontar para `.docs/<projeto>/README.md`.

## A Regra de Ouro

**Uma decisão nunca é sobrescrita silenciosamente.** Quando algo muda, a documentação antiga não é simplesmente apagada; ela é substituída ou atualizada de forma rastreável em ambas as direções.

1. **Footer de Impacto (`Document impact`)**: Todo novo documento deve terminar com um footer detalhando o que ele altera no projeto.
2. **Marcador Inline**: Onde a alteração ocorre no novo documento, deve haver um marcador `[→ overrides RFC-XXX §Y]`.
3. **Atualização Retroativa**: O documento antigo **deve** ser alterado para apontar para o novo com o marcador espelho `[← overridden by RFC-YYY §Z]`.

## Vocabulário de Relacionamento

| Relacionamento | Significado | Status do trecho antigo |
| --- | --- | --- |
| **Extends** | Adiciona algo que o doc antigo não cobria | ainda atual/válido |
| **Refines** | Altera a *interpretação* sem contradizer | atual, ler junto |
| **Overrides** | Substitui um *trecho específico* | obsoleto (siga a seta) |
| **Supersedes** | Substitui o documento *inteiro* | obsoleto (mantido como histórico) |
| **Depends on** | Depende da regra antiga para existir | atual e crítico |

## Checklist

- [ ] Esse documento muda como outro deveria ser lido?
- [ ] Footer preenchido?
- [ ] Marcador inline `[→]` inserido?
- [ ] Documento antigo editado com `[←]`?
- [ ] O arquivo do tracker (Tracking / ROADMAP) reflete essa feature?
