import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { profile, plan, reader } from "./delegation-fixtures";

function project(): string {
  const root = mkdtempSync(join(tmpdir(), "delegation-runtime-"));
  mkdirSync(resolve(root, ".maestro"), { recursive: true });
  return root;
}

const BASE = "# padrão\nApresente o plano antes de executar.";
const files = { ".maestro/subagents/maestro/behavior.md": BASE };

describe("AC-010 — runtime não entregue é recusado", () => {
  // SPECSFY: US-001 FR-004 NFR-002 AC-010
  it("cli é recusado nomeando a fatia ausente", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const config = { maestro: profile("maestro"), subagents: [] };

    const result = runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/cli/i);
      expect(result.reason).toMatch(/MA-5|ainda não/i);
    }
  });
});

describe("AC-011 — auto resolve para o nativo enquanto for a única via", () => {
  // SPECSFY: US-001 FR-004 NFR-001 AC-011
  it("emite briefing normalmente para runtime auto", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const config = { maestro: profile("maestro"), subagents: [] };

    const result = runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "auto" }]), config, reader(files), BASE);

    expect(result.ok).toBe(true);
  });
});

describe("AC-012 — emitir briefing não grava nada", () => {
  // SPECSFY: US-001 FR-004 NFR-002 AC-012
  it("o projeto permanece idêntico depois da emissão", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const root = project();
    const before = existsSync(join(root, ".maestro", "plans"));

    const config = { maestro: profile("maestro"), subagents: [] };
    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "native" }]), config, reader(files), BASE);

    expect(existsSync(join(root, ".maestro", "plans"))).toBe(before);
  });
});
