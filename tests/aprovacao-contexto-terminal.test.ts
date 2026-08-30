import { describe, it, expect } from "vitest";
import { resolveChannel } from "../src/approval/context";
import { contextoFixo } from "./aprovacao-fixtures";

describe("AC-063 — havendo terminal, a pergunta é feita", () => {
  // SPECSFY: US-060 FR-061 AC-063
  it("o canal escolhido é o interativo", () => {
    expect(resolveChannel(contextoFixo(true))).toBe("interactive");
  });

  // SPECSFY: US-060 FR-061 AC-063
  it("a escolha depende só do contexto injetado", () => {
    expect(resolveChannel(contextoFixo(true))).toBe(resolveChannel(contextoFixo(true)));
  });

  // SPECSFY: US-060 FR-061 AC-063
  it("terminal declarado nunca resulta em canal de documento", () => {
    expect(resolveChannel(contextoFixo(true))).not.toBe("document");
  });
});
