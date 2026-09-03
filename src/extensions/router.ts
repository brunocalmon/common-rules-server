/**
 * Minimalist router — a "proxy one-liner" (ADR 001, Epic 2.2): teaches the
 * agent to trigger the facade skill declaratively, instead of reading the
 * whole extension artifacts. Kept small on purpose — the context-saving
 * gain only holds if the router itself doesn't grow.
 */
export function buildRouterBlock(): string {
  return [
    "## common-rules",
    "",
    "To create, adjust or repair a local extension (a hook, a rule, or this",
    "router itself), trigger the `common-rules-extension-creator` skill",
    "instead of reading `.common-rules/extensions/` directly.",
  ].join("\n");
}

/** Minimal pointer, without duplicating the router's text — points at CLAUDE.md. */
export function buildAgentsPointer(): string {
  return "For the `common-rules` router, read the `common-rules` section in `CLAUDE.md`.";
}

/**
 * Language/config.yaml instruction — a separate anchored block from
 * `buildRouterBlock`, never grown into it: `createExtension` refuses to
 * update a name already registered, so folding this into `"router"` would
 * make it unreachable in any project that already ran `setup` once (DEC-002,
 * SPEC-0012).
 */
export function buildConfigLanguageBlock(): string {
  return [
    "## common-rules: language",
    "",
    "Read `.common-rules/config.yaml` before generating a document or deciding",
    "what language to answer in. Reply in the conversation's language. Write a",
    "generated document in `language.default`, unless its path matches one of",
    "`language.exceptions`. Notice when the conversation reveals a value that",
    "`config.yaml` is missing or has out of date, and offer to update it.",
  ].join("\n");
}

/** Minimal pointer, without duplicating the block's text — points at CLAUDE.md. */
export function buildConfigLanguagePointer(): string {
  return "For the `common-rules` language rule, read the `common-rules: language` section in `CLAUDE.md`.";
}
