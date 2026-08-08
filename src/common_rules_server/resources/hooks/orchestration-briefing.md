---
kind: hook
name: orchestration-briefing
description: >-
  Inject the orchestration contract at the start of every session, so the agent
  receives it whether or not it reads the project rules.
event: session-start
blocking: false
self_check:
  - Did the briefing actually reach the agent, or did the hook fail silently?
---

## Why this exists

Every other piece of guidance in this kit is something the agent *may* read. A
rules file can be skimmed, deprioritised behind a long conversation, or ignored
outright, and nothing detects that.

This hook fires from the editor itself, before the agent does anything, and
injects the contract as context. It is the only part of the system that does not
depend on the agent choosing to cooperate.

Keep it short. It is prepended to every session, so length here is a tax on
every conversation.

## Script

```sh
message="This project is orchestrated by the common-rules MCP server. Call get_context() before planning any work; it returns the full resource map in one call. Call get_resource(kind, name) for the instructions of anything you decide to use, and follow its relationship edges. Before declaring any task done, answer that resource's self_check questions honestly and end your reply with the session receipt."
decision=allow
```
