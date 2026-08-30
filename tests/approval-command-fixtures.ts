import type { ApprovalRegistry } from "../src/approval/registry";
import type { DependencyCommandItem } from "../src/approval/plan";

export function itemFake(
  kind: DependencyCommandItem["kind"],
  label: string,
  bin: string,
  args: string[],
): DependencyCommandItem {
  return { kind, label, bin, args };
}

export function registryFake(commands: { bin: string; args: string[] }[] = []): ApprovalRegistry {
  return { commands };
}
