import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-135 — registro de checksum ausente é divergência, não exceção", () => {
  // SPECSFY: US-081 FR-083 FR-084 NFR-080 NFR-081 NFR-082 AC-135
  it("arquivo presente sem entrada correspondente no registro é tratado como divergente", () => {
    const registro = registryFake([]);
    const targetEnv = targetEnvFake();

    expect(() => diagnoseExtensions(registro, targetEnv, ["orfao"])).not.toThrow();
    const divergentes = diagnoseExtensions(registro, targetEnv, ["orfao"]);
    expect(divergentes).toHaveLength(1);
    expect(divergentes[0].name).toBe("orfao");
    expect(divergentes[0].reason).toBe("checksum-missing");
  });
});
