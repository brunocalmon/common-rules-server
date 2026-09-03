import { describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncProjectFromStack } from "../src/config/sync";

function mktemp(): string {
  return mkdtempSync(join(tmpdir(), "common-rules-config-sync-"));
}

const COMPLETE_YAML = `language:
  default: en_US
  exceptions: []
project:
  prog_lang: ""
  runtime: ""
  package_manager: ""
  framework: ""
  test_framework: ""
  documentation_style: ""
system:
  os: linux
  distro: ""
  ram_gb: null
  cpu: ""
  gpu: ""
  baremetal: null
  container: null
git:
  default: ignored
  groups: {}
`;

function writeConfig(root: string, content: string = COMPLETE_YAML): string {
  const dir = join(root, ".common-rules");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "config.yaml");
  writeFileSync(path, content);
  return path;
}

function writeStack(root: string, tableRow: string): string {
  const dir = join(root, ".specsfy");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "STACK.md");
  writeFileSync(
    path,
    [
      "# Stack do sistema",
      "",
      "<!-- specsfy:stack:start -->",
      "| Camada | Tecnologia | Evidência |",
      "| --- | --- | --- |",
      tableRow,
      "<!-- specsfy:stack:end -->",
      "",
    ].join("\n"),
  );
  return path;
}

describe("AC-010 — sync populates project from STACK.md", () => {
  // SPECSFY: US-003 FR-005 FR-007 AC-010
  it("syncs prog_lang from the Linguagem row and touches nothing else", () => {
    const root = mktemp();
    const configPath = writeConfig(root);
    writeStack(root, "| Linguagem | TypeScript | `package.json` |");
    const before = readFileSync(configPath, "utf8");

    syncProjectFromStack(root);

    const after = readFileSync(configPath, "utf8");
    expect(after).toMatch(/prog_lang:\s*"?TypeScript"?/);
    expect(after.replace(/prog_lang:\s*"?TypeScript"?/, 'prog_lang: ""')).toBe(before);
  });
});

describe("AC-011 — sync is skipped without STACK.md", () => {
  // SPECSFY: US-003 FR-007 AC-011
  it("does not touch config.yaml when STACK.md is absent", () => {
    const root = mktemp();
    const configPath = writeConfig(root);
    const before = readFileSync(configPath, "utf8");

    syncProjectFromStack(root);

    expect(readFileSync(configPath, "utf8")).toBe(before);
  });
});

describe("AC-012 — sync is idempotent", () => {
  // SPECSFY: US-003 FR-005 FR-007 NFR-002 AC-012
  it("produces byte-identical content on a second run with unchanged STACK.md", () => {
    const root = mktemp();
    const configPath = writeConfig(root);
    writeStack(root, "| Linguagem | TypeScript | `package.json` |");

    syncProjectFromStack(root);
    const first = readFileSync(configPath, "utf8");
    syncProjectFromStack(root);
    const second = readFileSync(configPath, "utf8");

    expect(second).toBe(first);
  });
});
