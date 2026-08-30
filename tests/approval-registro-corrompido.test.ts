import { describe, it, expect } from "vitest";
import { readApprovalRegistry } from "../src/approval/registry";

describe("AC-119 — registro corrompido é tratado como vazio, falha segura", () => {
  // SPECSFY: FR-070 NFR-070 NFR-071 AC-119
  it("JSON inválido no registro resolve para lista vazia, sem lançar", () => {
    const env = { read: () => "{ isto não é json", write: () => {} };
    expect(() => readApprovalRegistry(env)).not.toThrow();
    expect(readApprovalRegistry(env).commands).toEqual([]);
  });

  // SPECSFY: FR-070 AC-119
  it("registro ausente (leitura vazia) resolve para lista vazia", () => {
    const env = { read: () => "", write: () => {} };
    expect(readApprovalRegistry(env).commands).toEqual([]);
  });
});
