---
name: coding-workflow
description: Use when implementing a feature, bug fix, refactor, test change, build change, or other repository modification after the task scope and orchestration mode are known.
---

# Coding Workflow

## Core rule

Make the smallest correct change and prove it. Evidence outranks confidence.

**REQUIRED SUB-SKILL:** Use `codex-harness:ponytail` while choosing and implementing the solution. Correctness, security, accessibility, compatibility, and explicit requirements always take priority over fewer lines of code.

## 1. Understand

Read active instructions, repository status, relevant code, tests, documented commands, and any relevant injected memories. Preserve unrelated changes. Verify recalled conventions and pitfalls against current repository evidence before relying on them. Establish the requested outcome, constraints, and completion evidence; ask only when a missing decision materially changes the result.

## 2. Choose the smallest solution

Check in order: no new code, reuse repository code, standard library, native platform, an installed dependency, then the smallest new implementation. Identify public-contract, migration, rollback, and compatibility effects when relevant. New dependencies require explicit user authorization.

Use support tools only when needed:

- Query Context7 for version-sensitive public library or API behavior. Send only the public library name, version, and API question—never proprietary code, internal identifiers, credentials, logs, or secrets.
- Use CodeGraph only when `.codegraph/` already exists. Otherwise use `rg` and targeted reads; never initialize it automatically.

## 3. Implement

For behavior changes and bug fixes, use RED → GREEN → REFACTOR:

1. Add or update one focused test and confirm it fails for the intended reason.
2. Implement only enough to pass.
3. Refactor only after green, then rerun the test.

Documentation and declarative configuration may use static validation. If automated testing is not meaningful, state why and use the strongest repeatable alternative.

## 4. Verify

Run targeted tests first, then relevant lint, typecheck, build, and broader tests. Review the final diff for correctness, regressions, security, sensitive data, error handling, compatibility, unnecessary dependencies, speculative abstractions, and unrelated edits.

Record exact commands and distinguish pre-existing failures from introduced failures with evidence.

## 5. Report

Report the changed behavior and files, verification results, unresolved risks, and Git actions. Do not claim completion without fresh evidence. Do not commit, push, or open a pull request unless explicitly requested.

Stable, verified preferences and project knowledge may become future Codex memories in the background. Never place secrets, credentials, personal data, raw logs, or temporary state into a memory candidate; required rules belong in `AGENTS.md` or checked-in documentation.
