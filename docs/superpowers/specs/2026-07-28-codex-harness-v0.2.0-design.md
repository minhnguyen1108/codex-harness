# Codex Harness v0.2.0 Hardening Design

## Goal

Turn the current personal/team Git marketplace plugin into a reproducible,
Codex-native `v0.2.0` release whose orchestration safeguards, lifecycle state,
package metadata, and validation match the current Codex plugin contract.

## Scope

This release keeps the existing Router → Explorer → Planner → Implementer →
Reviewer architecture and its dynamic model-selection policy. It hardens the
parts that are currently ambiguous, stale, or only weakly validated:

- package and marketplace metadata;
- bundled MCP configuration;
- specialist-agent ownership and retry rules;
- Ponytail lifecycle state;
- static and behavioral validation;
- cross-platform CI and release documentation.

The target is the existing GitHub marketplace used by individuals or teams.
Public Plugin Directory submission, branding assets, privacy policy, terms of
service, and hosted MCP review are outside this release.

## Current-State Findings

The repository already has a valid repo-local marketplace, a usable plugin
manifest, dynamic model selection, read-only specialist profiles, a single
Implementer policy, optional Context7 and CodeGraph servers, and a passing
source-tree validator.

The release is not yet complete because:

1. Material changes landed after the manifest version was last updated.
2. `.mcp.json` uses the legacy `mcpServers` wrapper instead of the documented
   direct server map or `mcp_servers` wrapper.
3. The installed-cache validator fails because it assumes the repository
   `README.md` exists outside the installed plugin.
4. The validator does not cover the marketplace, manifest, MCP shape, exact
   agent names, required agent instructions, or all model override keys.
5. Ponytail stores one global mode in `PLUGIN_DATA`, so concurrent sessions can
   overwrite one another and resume/compact can reset an explicit mode.
6. Implementer retry and verification ownership are not explicit enough to
   mechanically preserve a single writer.
7. The documented `direct` route treats configuration changes too broadly.

## Chosen Approach

Harden the current architecture rather than replacing it with built-in agents.
The custom profiles retain explicit read-only and workspace-write boundaries,
while the Router adds runtime checks that remain useful if a profile is
unavailable or a parent permission override weakens a profile default.

This avoids two inferior alternatives:

- Removing custom agents would reduce setup but lose the narrow Planner and
  Reviewer contracts and their explicit sandbox defaults.
- Preparing a public-directory release would add branding and legal work that
  does not improve this personal/team harness.

No production dependency, service, database, or model registry is added.

## Package and Release Contract

The manifest version becomes `0.2.0`. Build timestamps are not used as the
release identity because SemVer build metadata does not provide a useful
upgrade sequence. Both `repository` and `homepage` use
`https://github.com/minhnguyen1108/codex-harness`.

The install-surface metadata is future-safe:

- short description: `Route and verify coding work`;
- exactly these three default prompts:
  - `Decide the safest route for this coding change.`
  - `Trace this code path and identify change impact.`
  - `Review this diff for over-engineering.`
- component paths remain `./`-prefixed and inside the plugin root.

The MCP file uses the documented direct server-map shape:

```json
{
  "context7": {},
  "codegraph": {}
}
```

The existing server definitions remain unchanged inside that map. Both servers
stay optional, CodeGraph stays opt-in at the repository-index level, and no
secret is committed. Documentation pins the tested CodeGraph CLI version to
`1.2.0`; users may deliberately choose a newer version, but the release claim
is limited to the tested version.

The README distinguishes:

- rolling installation from `main` for active development;
- reproducible installation from the immutable `v0.2.0` tag;
- the requirement to reopen Codex and trust changed hooks after an update.

Creating the Git tag, committing, pushing, or opening a pull request remains a
separate Git action requiring explicit user authorization.

## Orchestration Contract

### Route selection

`direct` applies only to documentation and localized, low-risk configuration or
code changes with clear acceptance criteria. Cross-module, security-sensitive,
deployment, authentication, schema, migration, concurrency, dependency, and
unknown-cause work routes through `harness`.

### Read-only stages

Every Explorer, Planner, and Reviewer prompt carries the complete read-only
contract even when a named profile is requested. The coordinator records a Git
status/diff snapshot before and after each read-only phase. A changed workspace
invalidates the phase and stops the workflow until the unexpected write is
resolved.

Custom-agent sandbox fields remain defense in depth; the Router does not claim
that profile defaults override a stricter or live parent permission policy.

### Single writer

Only one Implementer may be active. A timeout does not authorize a replacement
Implementer:

1. inspect the existing agent state;
2. follow up with the same agent if it is idle;
3. interrupt and confirm it has stopped before replacement;
4. compare the current workspace with the last snapshot;
5. spawn a replacement only after the previous writer is no longer active.

The coordinator and all other specialists remain non-writing while the
Implementer owns the change.

### Verification ownership

The Implementer runs tests, builds, formatters, or other checks that can mutate
workspace artifacts. Reviewers inspect the diff and evidence, run only
read-only checks, and request any mutating rerun through the same Implementer.

RED → GREEN evidence is required for behavior changes and bug fixes.
Documentation and declarative configuration use the strongest repeatable
static validation instead of inventing a failing behavioral test.

### Models

The existing dynamic policy remains:

- direct work uses the parent task model;
- harness roles use only models Codex reports as available;
- if availability or role override information is missing, use the parent task
  model and record the fallback;
- no profile or instruction hard-codes a model or reasoning effort.

## Ponytail Session State

Ponytail mode becomes session-scoped under `PLUGIN_DATA`. Each hook reads the
Codex hook input and derives a safe state filename from `session_id`.

State transitions are:

- `startup` and `clear`: initialize the configured default mode;
- `resume` and `compact`: preserve the stored mode, initializing the default
  only when no state exists;
- `/ponytail lite|full|ultra|off`, `stop ponytail`, and `normal mode`: persist
  the explicit mode for that session, including `off`;
- `SubagentStart`: read the parent session mode and inject it when active;
- `SessionEnd`: remove that session's state file.

Concurrent session IDs never share a state file. Invalid or missing hook input
must not crash Codex or reuse another session's state: the hook emits a concise
failure and skips the state transition.

Hook commands use Codex-native `PLUGIN_ROOT` and `PLUGIN_DATA`. Compatibility
with `CLAUDE_PLUGIN_ROOT` is not required by this plugin after the change,
although Codex currently provides it.

## Validation

The dependency-free Node validator remains the single static entry point and
works from both:

- the source checkout; and
- an installed plugin cache that does not contain the repository README.

It validates:

- marketplace name, local source path, policies, category, and containment
  when the repository marketplace is present;
- manifest name, exact `0.2.0` version, component paths, repository metadata,
  prompt count, and short-description length;
- documented MCP map shape and the two optional server definitions;
- all expected skill and agent files;
- exact agent names, markers, sandbox modes, required instruction fragments,
  and absence of `model` or `model_reasoning_effort` keys;
- Router ownership, retry, verification, model fallback, and safety rules;
- hook registration for profile sync, Ponytail activation, mode tracking,
  subagent injection, and session cleanup;
- absence of hard-coded model IDs in active package instructions.

`tests/eval-cases.md` is explicitly labeled a manual scenario ledger. Static
validation does not claim to execute language-model routing behavior.

A second dependency-free Node test exercises hook behavior with temporary
plugin-data directories:

- independent state for two sessions;
- startup/clear initialization;
- resume/compact preservation;
- explicit `ultra` and `off` persistence;
- subagent context injection;
- SessionEnd cleanup;
- valid JSON output and nonzero failure behavior where applicable.

## Continuous Integration

A GitHub Actions workflow runs on pushes and pull requests using
`actions/checkout@v4`, `actions/setup-node@v4`, Node 20, and a matrix containing
`ubuntu-latest` and `windows-latest`. It executes:

```text
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-hooks.js
git diff --check
```

No package manager install or third-party action beyond checkout and Node setup
is required.

## Error Handling

- Missing optional MCP executables do not block plugin startup.
- A missing Node executable causes a visible hook failure instead of a silent
  skip because agent synchronization and Ponytail activation are required
  plugin behavior.
- Agent-profile conflicts preserve user-owned files and emit one concise
  conflict message.
- Hook state parse or filesystem errors are reported without exposing secrets
  or absolute user data beyond the path already owned by the plugin.
- An unexpected write during a read-only stage or an uncertain writer state
  stops the harness rather than spawning another writer.

## Acceptance Criteria

1. The source and installed-cache validators both exit successfully.
2. Hook behavior tests pass on Windows and Ubuntu.
3. Manifest, marketplace, MCP, skills, hooks, and agent profiles satisfy the
   current documented Codex plugin shape.
4. Two concurrent sessions preserve independent Ponytail modes.
5. Explicit `ultra` and `off` survive resume and compact.
6. Read-only stages detect workspace mutation.
7. A timed-out Implementer cannot coexist with a replacement writer.
8. Only the Implementer owns mutating verification.
9. No active profile or instruction hard-codes a model or reasoning effort.
10. `git diff --check` passes and the final diff contains no unrelated changes.
11. The README documents rolling and pinned installation accurately.
12. A clean `v0.2.0` install can expose the skills, optional MCP servers, and
    trusted hooks in a new Codex session; the actual tag/install smoke occurs
    only after Git publication is authorized.

## Non-Goals

- Publishing to the universal Plugin Directory.
- Adding icons, screenshots, privacy policy, or terms of service.
- Installing or initializing CodeGraph automatically.
- Persisting model selection between tasks.
- Guaranteeing that custom-agent sandbox defaults override live parent
  permission settings.
- Supporting multiple simultaneous writers.
- Adding a package manager, test framework, or runtime dependency.
