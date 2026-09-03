#!/usr/bin/env node
// Runs fatia 1a's verification cycle and records each step's time.
//
// Exists because the budget assertion reads measurements already taken,
// and doesn't take them itself: on a freshly obtained clone there's no
// record at all, and the suite fails. This script is the step AC-009
// describes as "the person runs the three steps in sequence," made repeatable.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STEPS = [
  { name: "install", command: "npm", args: ["ci", "--ignore-scripts"] },
  { name: "build", command: "npm", args: ["run", "build"] },
  { name: "test", command: "npm", args: ["run", "test:tdd"] },
];

const gitDir = spawnSync("git", ["rev-parse", "--absolute-git-dir"], { encoding: "utf8" })
  .stdout.trim();
const record = resolve(gitDir, "phase1a-timings.json");

// The suite measures an existing record and can't measure its own
// duration while it runs. That's why the install and build measurements
// are written before the suite, and its duration is updated afterward.
// `test` starts from the previous run's value, or zero on a freshly
// obtained clone.
const previous = existsSync(record) ? JSON.parse(readFileSync(record, "utf8")) : {};
const timings = { install: 0, build: 0, test: previous.test ?? 0 };

for (const step of STEPS) {
  const start = Date.now();
  const r = spawnSync(step.command, step.args, { stdio: "inherit" });
  timings[step.name] = Math.round((Date.now() - start) / 1000);

  if (step.name !== "test") writeFileSync(record, JSON.stringify(timings));

  if (r.status !== 0) {
    // Stops at the first failure: continuing would measure steps that no
    // longer make sense, and a partial record would suggest the cycle passed.
    console.error(`\ncycle interrupted: step ${step.name} failed with code ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

writeFileSync(record, JSON.stringify(timings));

const total = Object.values(timings).reduce((a, b) => a + b, 0);
const detail = STEPS.map((s) => `${s.name} ${timings[s.name]}s`).join(", ");
console.log(`\ncycle complete: ${detail} — total ${total}s`);
