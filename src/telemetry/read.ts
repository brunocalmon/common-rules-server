import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RECORD_PATH } from "../setup/record.js";

/**
 * Result of reading the identifier.
 *
 * The three cases are represented explicitly instead of by an empty
 * string, so that a consumer can tell "no record" apart from "record with
 * no identifier." Collapsing the two into an empty value would lose
 * exactly the information the diagnosis needs to give.
 */
export type TraceRead =
  | { kind: "identified"; trace: string }
  | { kind: "unidentified" }
  | { kind: "absent" };

/**
 * Reads the identifier of the last recorded run, without writing.
 *
 * Accepts records written before this fatia, which lack the field and
 * whose entries carry the epoch instant. Nothing is rewritten on read:
 * reporting and repairing are distinct operations in this product.
 */
export function readTrace(root: string): TraceRead {
  const path = join(root, RECORD_PATH);
  if (!existsSync(path)) return { kind: "absent" };
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as { trace?: unknown };
    const trace = raw.trace;
    if (typeof trace === "string" && trace.length > 0) return { kind: "identified", trace };
    return { kind: "unidentified" };
  } catch {
    // An unreadable record is treated as a missing identifier, not as a
    // diagnostic failure: `doctor` keeps reporting the dependencies.
    return { kind: "unidentified" };
  }
}
