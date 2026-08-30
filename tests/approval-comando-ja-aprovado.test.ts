import { describe, it, expect } from "vitest";
import { partitionByApproval } from "../src/approval/plan";
import { registryFake, itemFake } from "./approval-command-fixtures";

describe("AC-111 — comando desconhecido pede aprovação", () => {
  // SPECSFY: US-070 US-071 FR-070 FR-072 NFR-072 AC-111
  it("registro vazio, comando de skills pendente aparece como pendência", () => {
    const registro = registryFake([]);
    const item = itemFake("skills", "instalar skills de mattpocock", "node", ["cli.mjs", "add", "mattpocock/skills"]);
    const { approved, pending } = partitionByApproval(registro, [item]);
    expect(pending).toEqual([item]);
    expect(approved).toEqual([]);
  });
});

describe("AC-112 — comando já aprovado, argv idêntico, não pede de novo", () => {
  // SPECSFY: US-070 FR-070 FR-072 NFR-070 AC-112
  it("comando com argv exato já registrado não aparece como pendência, mesmo após drift", () => {
    const item = itemFake("skills", "instalar skills de mattpocock", "node", ["cli.mjs", "add", "mattpocock/skills"]);
    const registro = registryFake([{ bin: item.bin, args: item.args }]);
    const { approved, pending } = partitionByApproval(registro, [item]);
    expect(approved).toEqual([item]);
    expect(pending).toEqual([]);
  });
});
