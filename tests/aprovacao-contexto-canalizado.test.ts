import { describe, it, expect } from "vitest";
import { resolveChannel } from "../src/approval/context";
import { contextoFixo } from "./aprovacao-fixtures";

describe("AC-064 — sem terminal, a decisão vem do documento", () => {
  // SPECSFY: US-061 FR-061 AC-064
  it("o canal escolhido é o de documento", () => {
    expect(resolveChannel(contextoFixo(false))).toBe("document");
  });

  // SPECSFY: US-061 FR-061 AC-064
  it("ausência de terminal nunca resulta em canal interativo", () => {
    expect(resolveChannel(contextoFixo(false))).not.toBe("interactive");
  });

  // SPECSFY: US-061 FR-061 AC-064
  it("a escolha é determinística para o mesmo contexto", () => {
    const ctx = contextoFixo(false);
    expect(resolveChannel(ctx)).toBe(resolveChannel(ctx));
  });
});
