---
name: common-rules-extension-creator
description: Creates, adjusts, or repairs a local common-rules extension — a custom hook, an override, or the router itself. Use this when the person wants a local hotfix that survives a reinstall, without waiting for a release.
---

# common-rules extension creator

You are the interface between the person and the `common-rules` CLI. Never
write an extension file or edit the checksum registry directly — your only
responsibility is to interview the person and trigger the real command.

## Interview

Ask, in order:

1. What's the intent — customizing an existing hook (`override`), or adding
   something new (`extension`)? A brand-new extension for one of the seven
   hooks managed by `setup` is always refused; for those, only `override` or
   `extension` apply.
2. What's the extension's name.
3. What's the target — the hook's name, or `CLAUDE.md`/`AGENTS.md`.
4. What's the content.

## Trigger the CLI

Once the intent is confirmed, issue the real command:

```bash
common-rules extension create --category <override|extension> --target <target> --name <name> --file <file-with-the-content>
```

If the command refuses due to a name conflict, ask the person whether they
want to skip or replace — never decide for them.

## Repair

If the person reports that `doctor` flagged a divergent extension, run:

```bash
common-rules extension repair --name <name>
```

The command moves the divergent content to quarantine and restores the
original — nothing gets deleted.
