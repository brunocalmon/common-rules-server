import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum, insertAnchor } from "../src/extensions/anchor";

describe("AC-133/AC-135 — disk presence is resolved by target, not by name", () => {
  // SPECSFY: US-081 FR-083 NFR-080 NFR-082 AC-133 AC-135
  it("an intact artifact whose name differs from its target isn't falsely reported as an orphan", () => {
    const content = "# original content";
    const anchored = insertAnchor("", "extension", "my-extension", content);
    const targetEnv = targetEnvFake({ ".common-rules/extensions/my-hook.md": anchored });
    const registry = registryFake([
      {
        category: "extension",
        name: "my-extension",
        target: "my-hook",
        content,
        checksum: computeChecksum(content),
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ]);

    // The real `listPresentExtensionNames` returns the filename — same as the target, not the name.
    const divergent = diagnoseExtensions(registry, targetEnv, ["my-hook"]);
    expect(divergent).toHaveLength(0);
  });
});
