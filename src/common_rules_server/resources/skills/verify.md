---
kind: skill
name: verify
description: >-
  Build, test and lint the project and report what actually happened. Use after
  any code change, before claiming it works.
trigger: model-invoked
relationships:
  comes-from:
    - target: /dev-process
      required: false
    - target: /tdd
      required: false
  goes-to:
    - target: /review
      required: false
      note: Review once the build is green
  can-invoke:
    - target: /test-cycle
      required: false
      note: When coverage needs examining
  output: templates/verify.md
env:
  optional: [BUILD_COMMAND, TEST_COMMAND, LINT_COMMAND]
self_check:
  - Did every command actually run, or did I report a step I skipped?
  - Am I reporting the real output, including failures, rather than a summary that softens them?
  - If I substituted a command because none was configured, did I say which?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /dev-process | no | After implementation |
| comes-from | /tdd | no | After the red-green cycle |
| goes-to | /review | no | Review once green |
| can-invoke | /test-cycle | no | Coverage analysis |
| output | templates/verify.md | yes | Verification report |

## Instructions

Run each step and report the real result. Stop at the first failure — later
steps run against a broken build tell you nothing.

1. **Build.** `{{BUILD_COMMAND}}`. Skip only if the project genuinely has no
   build step.
2. **Test.** `{{TEST_COMMAND}}`. Report the counts: passed, failed, skipped.
3. **Lint.** `{{LINT_COMMAND}}`, when configured. Report violations by severity.

When a command is not configured, find it in the wiki or the build files rather
than inventing one, and tell the user what you used.

**Report what the tools said.** If tests failed, show the failure output and say
plainly that they failed. A verification step that reports success when it did
not run, or glosses a failure as a warning, removes the only reason the step
exists. If you skipped a step, say which and why.
