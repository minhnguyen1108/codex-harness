# Self-Contained Harness Design

## Goal

Make `codex-harness` self-contained: its specialist profiles install and update automatically, its Decision Agent owns dynamic model selection, and a repeatable static runner checks the harness contract.

## Architecture

The plugin bundle becomes the only source for `harness_explorer`, `harness_planner`, `harness_implementer`, and `harness_reviewer` profiles. Their TOML files move from `setup/agents/` to `plugins/codex-harness/agents/`, retain their role-specific sandbox and instructions, add a `# managed-by: codex-harness` marker, and omit `model` and `model_reasoning_effort`.

On `SessionStart`, a new Node hook synchronizes those profiles to `$CODEX_HOME/agents` when `CODEX_HOME` is set, otherwise `~/.codex/agents`. The sync writes atomically and is idempotent. It replaces only files whose first line is the managed marker. If a same-name target exists without that marker, it leaves the target unchanged and emits a concise conflict warning; it never overwrites user-owned profiles.

The existing Decision Agent remains responsible for selecting an available model at spawn time. With profile-level model fields absent, Codex applies explicit spawn values first, then its configured defaults, then the parent task model. The Router records selected assignments and fallbacks, but does not discover models itself or hard-code identifiers.

## Validation

Add a Node static runner under `plugins/codex-harness/tests/` that exits nonzero when any active plugin profile, Router, evaluation case, README, or profile source contains a hard-coded model ID; when required Decision Agent/safety/fallback text is absent; or when the hook manifest does not register the profile sync hook. The runner also validates each bundled profile has the managed marker, required role name, and expected sandbox mode.

## Files

- Create `plugins/codex-harness/agents/harness-*.toml` as the managed profile source.
- Create `plugins/codex-harness/hooks/harness-sync-agents.js`.
- Modify `plugins/codex-harness/hooks/hooks.json` to run the sync at `SessionStart`.
- Modify `plugins/codex-harness/tests/eval-cases.md` and add `plugins/codex-harness/tests/validate-harness.js`.
- Modify `plugins/codex-harness/.codex-plugin/plugin.json`, `README.md`, and `setup/AGENTS.example.md` for the packaged install flow.
- Delete `setup/agents/harness-*.toml` after their content has moved into the plugin bundle.

## Non-goals

- Discovering, installing, or enabling models.
- Overwriting user-owned custom profiles.
- Adding a service, dependency, database, MCP server, or background daemon.
- Guaranteeing a currently open task reloads updated plugin files; a new task or Codex restart remains required.
