---
name: harness-router
description: Use when a request may change code, tests, build configuration, schemas, dependencies, or multiple modules and needs routing between a direct workflow and coordinated specialist agents.
---

# Harness Router

## Core rule

Decide once, route once, then execute. Parallelize independent read-only work, never writers. Keep support tools and implementation mechanics inside the selected workflow instead of exposing them as top-level branches.

## Decision Agent

Harness Router is the internal Decision Agent. It uses the prompt and current repository evidence to decide how work proceeds before it routes. Keep the decision internal:

```yaml
decision:
  goal: short requested outcome
  assumptions: [safe defaults used]
  blockers: [only material unanswered decisions]
  mode: direct | harness
  risk: low | medium | high
  fanout: 0 | 1 | 2 | 3
  reasons: [short evidence-based reasons]
```

Proceed when the requested outcome, constraints, and completion evidence can be reasonably inferred. Record safe assumptions instead of asking for preferences that can be safely defaulted. Ask one concise question only when an unanswered decision could materially change the requested result, broaden authority, introduce meaningful safety risk, or make verification impossible. Never ask merely to choose an implementation detail that repository evidence can settle.

## Five-stage flow

1. **Understand:** read active instructions, relevant injected memories, and identify the requested outcome, constraints, and completion evidence.
2. **Decide and route:** record the Decision Agent contract, then select `direct` or `harness` once before editing.
3. **Execute:** make the smallest correct change through `codex-harness:coding-workflow`.
4. **Verify:** run relevant checks and review the diff.
5. **Report:** provide results, evidence, remaining risks, and Git actions.

## Route decision

The Decision Agent keeps its route decision internal as part of the decision contract:

```yaml
mode: direct | harness
risk: low | medium | high
fanout: 0 | 1 | 2 | 3
reasons: [short evidence-based reasons]
```

Honor a prompt-leading `direct:` or `harness:` override. An override changes orchestration only; it never removes safety or verification.

- Choose `direct` for documentation, configuration, or a localized change with clear acceptance criteria. Keep work on the main agent.
- Choose `harness` for an unknown cause, cross-module behavior, public API, schema or migration, security, concurrency, a new dependency, or multiple workstreams.
- If uncertain, perform a short read-only inspection, then route once. Do not repeatedly reclassify the task.

## Execution shape

### Direct

Understand → implement → verify → report. Keep work on the main agent with `fanout: 0`. Self-review the final diff; no specialist reviewer is required.

### Harness

1. Define Goal, Constraints, and Done When.
2. Decompose exploration into independent read-only workstreams with `WORKSTREAM_ID`, `SCOPE`, `QUESTIONS`, `EXCLUSIONS`, and dependencies.
3. Fan out up to three `harness_explorer` instances only for independent workstreams, then wait at a join barrier. Use one Explorer when the investigation is sequential or tightly coupled.
4. Send the merged reports to one `harness_planner`. It resolves contradictions by evidence and produces one decision-complete plan.
5. Send the consolidated plan to one `harness_implementer`. It is the sole writer and uses `codex-harness:coding-workflow`.
6. For low risk, use one `harness_reviewer`. For medium or high risk with independent review concerns, fan out at most two read-only reviewers: one for correctness/regressions/tests and one for security/compatibility/scope. Wait at a join barrier and consolidate duplicate or conflicting findings into one verdict.
7. Return `PASS` or `CHANGES_REQUIRED`. Send one consolidated findings bundle back to the same Implementer.

Allow at most two repair-review rounds across the whole task, not per reviewer. After the cap, report a blocker with evidence.

## Parallelization policy

- Fan out only when at least two workstreams can run without shared mutable state or sequential dependencies. Otherwise run them sequentially.
- Use two Explorers by default when parallelism is justified; use three only when a third scope is genuinely independent. Never exceed available concurrency.
- Partition by question or responsibility, not arbitrary file counts. Typical scopes are behavior/impact, tests/conventions, and API/schema/security.
- Give every child a narrow scope, exclusions, required evidence format, and expected output. Reports must cite files, symbols, commands, or documentation and distinguish facts from inferences.
- Only the top-level coordinator may fan out, and it owns the global cap of three active child agents. Explorer, Planner, Implementer, and Reviewer instances must never spawn another agent.
- Do not let multiple agents investigate the same scope merely for consensus. Use a targeted second opinion only when risk justifies it.
- Treat Explorer evidence as stale if relevant files or Git status change before implementation. Re-inspect the affected scope before writing.
- If a child fails or times out, retry once only when new context or a narrower scope can help. Otherwise fall back to safe sequential read-only exploration or report a blocker. Fallback never changes ownership: all writes still go through the same Implementer.
- Reviewer instances provide focus-specific findings; the coordinator owns deduplication and the single final verdict.

## Decision Agent model selection

Decision Agent owns model selection. It uses only the models Codex reports as available for the current task and records the allocation internally:

```yaml
decision:
  available_models: [models reported by Codex]
  assignments:
    explorer: available model suited to read-heavy analysis
    planner: available model suited to synthesis
    implementer: available model suited to implementation
    reviewer: available model suited to high-confidence review
  fallbacks: [reason the parent task model is used]
```

- For `direct`, use the parent task model and create no role assignments.
- For `harness`, select from `available_models` according to the task and risk: Explorer favors efficient read-heavy analysis, Planner and Implementer favor balanced synthesis and implementation, and Reviewer favors high-confidence correctness, security, and edge-case review.
- Decision Agent must not hard-code model IDs or assume model availability. Model selection is an internal capability decision, not a user preference to request.
- If Codex does not expose `available_models` or cannot honor a role override, use the parent task model for the affected roles, record the fallback, and continue only when the same safety boundary can be maintained.

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
- Run tests or builds that write shared artifacts sequentially, then perform final verification against one final workspace snapshot.
- Do not commit, push, open a pull request, add a dependency, or initialize CodeGraph without explicit user authorization.
- If a specialist is unavailable, continue only when the same safety boundary can be maintained.
