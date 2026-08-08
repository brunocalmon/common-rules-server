[← Wiki Hub](README.md)

---

# Documentation Protocol

This project follows the protocol defined in the reusable template. The rules
below are the operative summary; the template holds the full explanation.

## The hub rule

The root `README.md` is a hub. It states what the project is and links here. It
holds no architecture, guides or long-form explanation.

## The golden rule

A decision is never overwritten silently. When a new document changes how an
existing one should be read:

1. The new document ends with an **impact footer** stating what it changes.
2. The point of change carries `[→ overrides <DOC> §<section>]`.
3. The superseded document is edited to carry `[← overridden by <DOC> §<section>]`.

Step three is the one that gets skipped and the one that matters: without it, a
reader landing on the old page cannot tell it is stale.

## Relationship vocabulary

| Relationship | Meaning | Status of the older text |
|---|---|---|
| Extends | Adds what the older document did not cover | Still current |
| Refines | Changes interpretation without contradicting | Current; read both |
| Overrides | Replaces a specific passage | That passage is obsolete |
| Supersedes | Replaces the document entirely | Obsolete; kept as history |
| Depends on | Relies on the older document | Current and load-bearing |

## Checklist

- [ ] Does this change how another document should be read?
- [ ] Impact footer added?
- [ ] Inline marker placed?
- [ ] Mirror marker added to the older document?
- [ ] Navigation still resolves?
- [ ] Tracker updated?


---

← Previous: [Wiki Hub](README.md) · Next: [Product Requirements](product/PRD.md) →
