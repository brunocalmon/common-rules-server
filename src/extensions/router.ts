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
