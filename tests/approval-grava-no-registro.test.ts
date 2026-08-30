import { describe, it, expect } from "vitest";
import { recordApproval } from "../src/approval/plan";
import { registryFake, itemFake } from "./approval-command-fixtures";

describe("AC-114 — aprovar grava o comando novo no registro", () => {
  // SPECSFY: US-070 FR-073 NFR-071 AC-114
  it("comando aprovado passa a constar do registro devolvido", () => {
    const item = itemFake("specsfy", "instalar framework Specsfy", "node", [
      "specsfy.cjs",
      "install",
      "--project",
      "/tmp/proj",
      "--json",
    ]);
    const novo = recordApproval(registryFake([]), [item]);
    expect(novo.commands).toEqual([{ bin: item.bin, args: item.args }]);
  });

  // SPECSFY: FR-073 AC-114
  it("comando já presente no registro não duplica", () => {
    const item = itemFake("specsfy", "instalar framework Specsfy", "node", [
      "specsfy.cjs",
      "install",
      "--project",
      "/tmp/proj",
      "--json",
    ]);
    const registro = registryFake([{ bin: item.bin, args: item.args }]);
    const novo = recordApproval(registro, [item]);
    expect(novo.commands).toHaveLength(1);
  });
});
