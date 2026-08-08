[← Wiki Hub](README.md)

---

# Documentation Protocol

How decisions are recorded, superseded and navigated.

## The hub rule

The `README.md` at the repository root is a hub. It states what the project is
in a few lines and links into this wiki. It does not hold architecture, guides
or long-form explanation — those live here, where they can be organised and
retired properly.

A root README that accumulates content becomes the only page anyone reads, and
then the only page anyone maintains.

## The golden rule

**A decision is never overwritten silently.**

When a new document changes how an existing one should be read, both ends are
updated. A reader who arrives at either page is sent to the other.

1. **Impact footer.** The new document ends with a footer stating what it
   changes elsewhere.
2. **Inline marker.** At the point of change, the new document carries
   `[→ overrides <DOC> §<section>]`.
3. **Mirror marker.** The superseded document is edited to carry
   `[← overridden by <DOC> §<section>]` at the affected point.

Step three is the one that gets skipped, and it is the one that matters. Without
it, a reader landing on the old page has no way to know it is stale.

## Relationship vocabulary

| Relationship | Meaning | Status of the older text |
|---|---|---|
| **Extends** | Adds something the older document did not cover | Still current |
| **Refines** | Changes the interpretation without contradicting | Current; read both |
| **Overrides** | Replaces a specific passage | That passage is obsolete |
| **Supersedes** | Replaces the document entirely | Obsolete; kept as history |
| **Depends on** | Relies on the older document to make sense | Current and load-bearing |

## Impact footer format

```markdown
---

**Document impact**

| Relationship | Target | Section | Summary |
|---|---|---|---|
| Overrides | ADR-004 | §Storage | Object storage replaces the local disk cache |
```

## Checklist

Before merging a documentation change:

- [ ] Does this change how another document should be read?
- [ ] Impact footer added?
- [ ] Inline `[→ overrides ...]` marker placed?
- [ ] Mirror `[← overridden by ...]` marker added to the older document?
- [ ] Navigation links from the hub still resolve?
- [ ] Does the tracker reflect this work?


---

← Previous: [Wiki Hub](README.md) · Next: [Product Requirements](product/PRD-TEMPLATE.md) →
