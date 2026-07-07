---
name: harness-router
description: Use when a request may change code, tests, build configuration, schemas, dependencies, or multiple modules and needs routing between a direct workflow and coordinated specialist agents.
---

# Harness Router

## Core rule

Route once, then execute. Keep support tools and implementation mechanics inside the selected workflow instead of exposing them as top-level branches.

## Five-stage flow

1. **Understand:** read active instructions, relevant injected memories, and identify the requested outcome, constraints, and completion evidence.
2. **Route:** select `direct` or `harness` once before editing.
3. **Execute:** make the smallest correct change through `codex-harness:coding-workflow`.
4. **Verify:** run relevant checks and review the diff.
5. **Report:** provide results, evidence, remaining risks, and Git actions.

## Route decision

Keep the decision internal:

```yaml
mode: direct | harness
risk: low | medium | high
reasons: [short evidence-based reasons]
```

Honor a prompt-leading `direct:` or `harness:` override. An override changes orchestration only; it never removes safety or verification.

- Choose `direct` for documentation, configuration, or a localized change with clear acceptance criteria. Keep work on the main agent.
- Choose `harness` for an unknown cause, cross-module behavior, public API, schema or migration, security, concurrency, a new dependency, or multiple workstreams.
- If uncertain, perform a short read-only inspection, then route once. Do not repeatedly reclassify the task.

## Execution shape

### Direct

Understand → implement → verify → report. Self-review the final diff; no specialist reviewer is required.

### Harness

1. Define Goal, Constraints, and Done When.
2. Explorer gathers repository evidence and risks.
3. Planner produces a decision-complete plan.
4. Implementer is the sole writer and uses `codex-harness:coding-workflow`.
5. Reviewer returns `PASS` or `CHANGES_REQUIRED` for correctness, tests, security, compatibility, and scope.

Send review findings back to the same implementer. Allow at most two repair-review rounds, then report a blocker with evidence.

## Policies that run inside the flow

- Ponytail guides solution size; it is not a routing stage.
- Memory recalls stable preferences, recurring workflows, project conventions, and known pitfalls. Treat recalled facts as hypotheses until verified against current instructions and repository evidence.
- Context7 is consulted only for version-sensitive public library or API questions.
- CodeGraph is used for exploration only when `.codegraph/` already exists; otherwise use `rg` and targeted reads.
- RED → GREEN → REFACTOR applies inside implementation when behavior changes.
- Never use minimalism to weaken correctness, security, accessibility, compatibility, or explicit requirements.

## Memory policy

- Current prompts, `AGENTS.md`, checked-in documentation, and repository evidence override memory.
- Good memory candidates are durable preferences, verified conventions, recurring commands, architecture decisions, and confirmed pitfalls.
- Do not rely on memory for secrets, credentials, tokens, personal data, raw logs, temporary task state, transient environment values, or unverified assumptions.
- Keep rules that must always apply in `AGENTS.md`; memory is a local recall layer, not an enforcement mechanism.
- Do not edit generated files under `~/.codex/memories/` as part of normal workflow. Use `/memories` for per-thread controls.

## Safety

- Preserve repository instructions and unrelated user changes.
- Never run multiple writers.
- Do not commit, push, open a pull request, add a dependency, or initialize CodeGraph without explicit user authorization.
- If a specialist is unavailable, continue only when the same safety boundary can be maintained.
