# Codex Harness v0.2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a reproducible, Codex-native `v0.2.0` personal/team marketplace plugin with hardened orchestration, session-scoped Ponytail state, complete dependency-free validation, and Windows/Linux CI.

**Architecture:** Keep the existing Router and four specialist profiles. Strengthen their written and mechanically checked ownership contract, change Ponytail from one plugin-global mode file to one state file per Codex session, and make the package validator cover every distributable surface while remaining runnable from both a source checkout and an installed cache.

**Tech Stack:** Markdown skills and documentation, JSON plugin/marketplace/hook/MCP manifests, TOML custom-agent profiles, dependency-free CommonJS on Node.js 20, GitHub Actions.

## Global Constraints

- Target the existing personal/team Git marketplace; public Plugin Directory submission is out of scope.
- Use plugin version `0.2.0` without timestamp build metadata.
- Add no runtime or development dependency.
- Keep Context7 and CodeGraph optional; never initialize CodeGraph automatically.
- Pin the documented tested CodeGraph CLI version to `1.2.0`.
- Keep model and reasoning selection dynamic; do not add `model` or `model_reasoning_effort` to any profile.
- Only one Implementer may write or run checks that mutate workspace artifacts.
- Preserve user-owned agent profiles that do not start with `# managed-by: codex-harness`.
- Do not commit, tag, push, or open a pull request without a separate explicit Git authorization.

---

### Task 1: Make the package contract reproducible

**Files:**
- Modify: `plugins/codex-harness/tests/validate-harness.js`
- Modify: `plugins/codex-harness/.codex-plugin/plugin.json`
- Modify: `plugins/codex-harness/.mcp.json`

**Interfaces:**
- Consumes: repository root when present; installed plugin root always.
- Produces: one `node tests/validate-harness.js` entry point that validates package metadata and runs without a repository README.

- [ ] **Step 1: Extend the validator with failing package assertions**

Replace the validator setup with these roots and helpers:

```js
const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(pluginRoot, '..', '..');
const readPlugin = (file) => fs.readFileSync(path.join(pluginRoot, file), 'utf8');
const readJson = (file) => JSON.parse(readPlugin(file));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
```

Parse `plugin.json` and `.mcp.json`, then assert:

```js
const manifest = readJson('.codex-plugin/plugin.json');
const mcp = readJson('.mcp.json');
const prompts = [
  'Decide the safest route for this coding change.',
  'Trace this code path and identify change impact.',
  'Review this diff for over-engineering.',
];

assert(manifest.name === 'codex-harness', 'Unexpected plugin name.');
assert(manifest.version === '0.2.0', 'Plugin version must be 0.2.0.');
assert(manifest.repository === 'https://github.com/minhnguyen1108/codex-harness', 'Repository metadata mismatch.');
assert(manifest.homepage === manifest.repository, 'Homepage must match repository.');
assert(manifest.interface.shortDescription === 'Route and verify coding work', 'Short description mismatch.');
assert(JSON.stringify(manifest.interface.defaultPrompt) === JSON.stringify(prompts), 'Default prompts mismatch.');
assert(!Object.hasOwn(mcp, 'mcpServers'), 'Legacy mcpServers wrapper remains.');
for (const name of ['context7', 'codegraph']) {
  assert(mcp[name] && mcp[name].required === false, `Optional MCP server invalid: ${name}`);
}
```

For every manifest path in `skills` and `mcpServers`, require `./`, resolve it
against `pluginRoot`, require the resolved path to remain inside `pluginRoot`,
and require it to exist.

If `path.join(repoRoot, '.agents', 'plugins', 'marketplace.json')` exists, parse
it and verify the marketplace name, single plugin name, `./plugins/codex-harness`
source path, `AVAILABLE`, `ON_INSTALL`, `Productivity`, and path containment.

Build the fixed-model scan from package files and include the repository README
only when it exists:

```js
const activeText = [
  readPlugin('skills/harness-router/SKILL.md'),
  readPlugin('tests/eval-cases.md'),
];
const readmePath = path.join(repoRoot, 'README.md');
if (fs.existsSync(readmePath)) activeText.push(fs.readFileSync(readmePath, 'utf8'));
assert(!/gpt-\d/i.test(activeText.join('\n')), 'Fixed model ID remains.');
```

- [ ] **Step 2: Run the validator and prove the package assertions fail**

Run:

```powershell
node plugins\codex-harness\tests\validate-harness.js
```

Expected: nonzero exit, first failure `Plugin version must be 0.2.0.`

- [ ] **Step 3: Update the manifest**

Set these exact values:

```json
{
  "version": "0.2.0",
  "homepage": "https://github.com/minhnguyen1108/codex-harness",
  "repository": "https://github.com/minhnguyen1108/codex-harness"
}
```

Keep `skills` and `mcpServers` unchanged. Set:

```json
"shortDescription": "Route and verify coding work",
"defaultPrompt": [
  "Decide the safest route for this coding change.",
  "Trace this code path and identify change impact.",
  "Review this diff for over-engineering."
]
```

- [ ] **Step 4: Convert `.mcp.json` to the documented direct map**

Remove only the outer `mcpServers` object. The top-level keys become
`context7` and `codegraph`; retain every existing server field and
`"required": false`.

- [ ] **Step 5: Run the package validator**

Run:

```powershell
node plugins\codex-harness\tests\validate-harness.js
git diff --check
```

Expected: `Harness static validation passed.` and both commands exit zero.

- [ ] **Step 6: Review the Task 1 diff**

Verify only the validator, manifest, and MCP map changed. Leave the changes
uncommitted.

---

### Task 2: Harden routing and single-writer ownership

**Files:**
- Modify: `plugins/codex-harness/tests/validate-harness.js`
- Modify: `plugins/codex-harness/tests/eval-cases.md`
- Modify: `plugins/codex-harness/skills/harness-router/SKILL.md`
- Modify: `plugins/codex-harness/agents/harness-implementer.toml`
- Modify: `plugins/codex-harness/agents/harness-reviewer.toml`

**Interfaces:**
- Consumes: existing direct/harness decision contract and named profiles.
- Produces: explicit read-only snapshot checks, one-writer retry rules, and verification ownership enforced by static validation.

- [ ] **Step 1: Add failing orchestration assertions**

In `validate-harness.js`, require these Router phrases:

```js
for (const text of [
  'localized, low-risk configuration',
  'snapshot before and after every read-only phase',
  'Only one Implementer may be active',
  'confirm it has stopped before replacement',
  'mutating verification',
]) {
  assert(router.includes(text), `Missing router rule: ${text}`);
}
```

Validate exact profile contracts:

```js
const profiles = {
  'harness-explorer.toml': ['harness_explorer', 'read-only', 'Never spawn agents'],
  'harness-planner.toml': ['harness_planner', 'read-only', 'never spawn agents'],
  'harness-implementer.toml': ['harness_implementer', 'workspace-write', 'sole writer'],
  'harness-reviewer.toml': ['harness_reviewer', 'read-only', 'mutating verification'],
};

for (const [file, required] of Object.entries(profiles)) {
  const profile = readPlugin(`agents/${file}`);
  assert(profile.startsWith('# managed-by: codex-harness'), `Missing managed marker: ${file}`);
  assert(!/^\s*model(?:_reasoning_effort)?\s*=/m.test(profile), `Pinned model setting: ${file}`);
  for (const text of required) assert(profile.includes(text), `Invalid profile ${file}: ${text}`);
}
```

- [ ] **Step 2: Run the validator and prove the new rules are absent**

Run:

```powershell
node plugins\codex-harness\tests\validate-harness.js
```

Expected: nonzero exit with `Missing router rule: localized, low-risk configuration`.

- [ ] **Step 3: Narrow direct routing**

Change the direct rule to:

```markdown
- Choose `direct` for documentation, localized low-risk configuration, or a localized code change with clear acceptance criteria.
```

State that security-sensitive, deployment, authentication, cross-module,
schema, migration, concurrency, dependency, and unknown-cause configuration
uses `harness`.

- [ ] **Step 4: Add read-only phase protection**

Add this contract under parallelization:

```markdown
Before spawning a read-only phase, record a workspace snapshot using Git status
and diff when available, otherwise targeted file metadata. Include the full
read-only contract in every Explorer, Planner, and Reviewer prompt even when a
named profile is selected. Compare the snapshot after the phase. Any unexpected
write invalidates its evidence and stops the workflow until the mutation is
resolved.
```

Include the exact phrase `snapshot before and after every read-only phase`.

- [ ] **Step 5: Make Implementer retry safe**

Add a dedicated writer-lifecycle rule:

```markdown
Only one Implementer may be active. A timeout never authorizes a second writer.
Inspect the existing agent state, follow up with the same idle agent when
possible, and confirm it has stopped before replacement. Recheck the workspace
snapshot before a replacement starts.
```

Restrict the generic retry rule to read-only children.

- [ ] **Step 6: Assign verification ownership**

State that only the Implementer runs tests, builds, formatters, or other
mutating verification. Reviewers inspect the diff and evidence, run only
read-only checks, and request mutating reruns through the same Implementer.

Change `harness-implementer.toml` so its instruction requires RED/GREEN evidence
only for behavior changes and static validation for documentation or
declarative configuration.

Change `harness-reviewer.toml` so it contains `mutating verification` and
requires such reruns through the Implementer.

- [ ] **Step 7: Add manual scenarios**

Add cases to `tests/eval-cases.md` for:

- a local lint toggle versus cross-module authentication configuration;
- a read-only child changing a file;
- an Implementer timing out while still active;
- a Reviewer requesting a build that writes generated artifacts.

Rename the introductory sentence to explicitly call the file a manual scenario
ledger, not an automated behavioral eval.

- [ ] **Step 8: Verify Task 2**

Run:

```powershell
node plugins\codex-harness\tests\validate-harness.js
git diff --check
```

Expected: both commands exit zero.

- [ ] **Step 9: Review the Task 2 diff**

Confirm dynamic model selection, the three-child global cap, and the two-round
repair cap remain intact. Leave changes uncommitted.

---

### Task 3: Scope Ponytail state to each Codex session

**Files:**
- Create: `plugins/codex-harness/tests/test-hooks.js`
- Create: `plugins/codex-harness/hooks/ponytail-cleanup.js`
- Modify: `plugins/codex-harness/hooks/ponytail-runtime.js`
- Modify: `plugins/codex-harness/hooks/ponytail-activate.js`
- Modify: `plugins/codex-harness/hooks/ponytail-mode-tracker.js`
- Modify: `plugins/codex-harness/hooks/ponytail-subagent.js`
- Modify: `plugins/codex-harness/hooks/harness-sync-agents.js`
- Modify: `plugins/codex-harness/hooks/hooks.json`
- Modify: `plugins/codex-harness/tests/validate-harness.js`

**Interfaces:**
- Consumes: Codex hook JSON on stdin with `session_id`, `source`, and `prompt`.
- Produces: `getStatePath(sessionId)`, `setMode(mode, sessionId)`, `readMode(sessionId)`, `clearMode(sessionId)`, and `readHookInput()` plus isolated state files under `PLUGIN_DATA`.

- [ ] **Step 1: Write the failing hook behavior test**

Create a dependency-free `tests/test-hooks.js` using:

```js
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const hooksDir = path.join(pluginRoot, 'hooks');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-harness-hooks-'));

function run(script, input, extraEnv = {}) {
  return childProcess.spawnSync(process.execPath, [path.join(hooksDir, script)], {
    cwd: pluginRoot,
    env: { ...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: dataDir, ...extraEnv },
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
}
```

Set `process.env.PLUGIN_DATA = dataDir`, reload `ponytail-runtime.js`, and use
its exported `readMode` for assertions.

Cover this exact sequence:

1. session A startup → `full`;
2. session A prompt `/ponytail ultra` → `ultra`;
3. session B startup → `full`;
4. session A compact → remains `ultra`;
5. session A `stop ponytail` → stored `off`;
6. session A resume → remains `off`;
7. session B SubagentStart → emits Ponytail context;
8. session A SubagentStart → emits no active context;
9. session B clear → resets to `full`;
10. SessionEnd removes only the target session state;
11. missing `session_id` exits nonzero and does not create shared state.

Also test profile sync with an isolated `CODEX_HOME`: four profiles are copied,
a user-owned conflicting profile is preserved with one valid JSON warning, and
a second sync is idempotent.

Always remove only `dataDir` in `finally` with `fs.rmSync(dataDir, {
recursive: true, force: true })`.

- [ ] **Step 2: Run the hook test and prove global state fails**

Run:

```powershell
node plugins\codex-harness\tests\test-hooks.js
```

Expected: nonzero exit because current runtime does not export session-scoped
state APIs and resume/compact overwrite explicit modes.

- [ ] **Step 3: Implement session-scoped runtime helpers**

In `ponytail-runtime.js`, use `crypto.createHash('sha256')` to derive a safe
filename from `session_id`:

```js
function getStatePath(sessionId) {
  if (!isCodex) return path.join(stateDir, '.ponytail-active');
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('PONYTAIL_SESSION_ID_REQUIRED');
  }
  const key = crypto.createHash('sha256').update(sessionId).digest('hex');
  return path.join(stateDir, `ponytail-${key}.mode`);
}
```

Make `setMode`, `readMode`, and `clearMode` accept `sessionId`. Persist `off`
instead of deleting it.

Add:

```js
function readHookInput() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(input.replace(/^\uFEFF/, ''));
        if (!data.session_id) throw new Error('PONYTAIL_SESSION_ID_REQUIRED');
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
    process.stdin.on('error', reject);
  });
}
```

Export all five helpers.

- [ ] **Step 4: Update activation state transitions**

Make `ponytail-activate.js` await `readHookInput()`. For `resume` and `compact`,
use stored mode when present, otherwise the configured default. For `startup`
and `clear`, set the configured default. Pass `session_id` to every state
operation. On failure, write `CODEX_HARNESS_HOOK_FAILED:<message>` to stderr and
set a nonzero exit code.

- [ ] **Step 5: Update mode tracking and subagent injection**

Make both scripts await `readHookInput()`.

`ponytail-mode-tracker.js` persists `off` for `/ponytail off`, `stop ponytail`,
and `normal mode`. It passes `session_id` for all mode operations.

`ponytail-subagent.js` reads the parent `session_id`, injects instructions only
when the stored mode is active, and emits nothing for absent or `off`.

- [ ] **Step 6: Add SessionEnd cleanup**

Create `ponytail-cleanup.js`:

```js
#!/usr/bin/env node
const { clearMode, readHookInput } = require('./ponytail-runtime');

readHookInput()
  .then(({ session_id: sessionId }) => clearMode(sessionId))
  .catch((error) => {
    process.stderr.write(`CODEX_HARNESS_HOOK_FAILED:${error.message}`);
    process.exitCode = 1;
  });
```

Register it under `SessionEnd` with timeout `3`.

- [ ] **Step 7: Use native plugin environment variables and visible failures**

In `hooks.json`, replace `${CLAUDE_PLUGIN_ROOT}` with `${PLUGIN_ROOT}` and
`$env:CLAUDE_PLUGIN_ROOT` with `$env:PLUGIN_ROOT`. Remove `; exit 0`.

Every Windows command first verifies Node:

```powershell
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error 'Node.js is required by codex-harness hooks'; exit 1 }
```

Then run the hook script. Keep the existing matchers.

- [ ] **Step 8: Emit one valid profile-sync warning**

Change `harness-sync-agents.js` to collect conflict strings in an array and
write at most one JSON object:

```js
const warnings = [];
// push conflict messages during the loop
if (warnings.length) {
  process.stdout.write(JSON.stringify({ systemMessage: warnings.join(',') }));
}
```

On a filesystem failure, write one JSON `systemMessage` and set a nonzero exit
code.

- [ ] **Step 9: Extend static hook validation**

Require registration of `ponytail-cleanup.js`; reject
`CLAUDE_PLUGIN_ROOT`; require `PLUGIN_ROOT`; and require the runtime source to
contain `session_id` and `getStatePath`.

- [ ] **Step 10: Run hook and static tests**

Run:

```powershell
node plugins\codex-harness\tests\test-hooks.js
node plugins\codex-harness\tests\validate-harness.js
Get-ChildItem plugins\codex-harness\hooks\*.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Expected: hook test prints `Harness hook tests passed.`, static validator prints
`Harness static validation passed.`, and every command exits zero.

- [ ] **Step 11: Review the Task 3 diff**

Confirm no hook writes outside `PLUGIN_DATA` except the intentional managed
agent sync into the isolated or real `CODEX_HOME`; user-owned conflicts remain
untouched. Leave changes uncommitted.

---

### Task 4: Document and continuously verify v0.2.0

**Files:**
- Create: `.github/workflows/validate.yml`
- Modify: `README.md`
- Modify: `plugins/codex-harness/tests/validate-harness.js`

**Interfaces:**
- Consumes: the complete v0.2.0 package and test commands.
- Produces: accurate rolling/pinned installation instructions and a Windows/Linux CI gate.

- [ ] **Step 1: Add README assertions**

When the repository README exists, require these strings in the validator:

```js
for (const text of [
  'v0.2.0',
  '--ref main',
  '--ref v0.2.0',
  '@colbymchenry/codegraph@1.2.0',
  'node plugins/codex-harness/tests/test-hooks.js',
]) {
  assert(readme.includes(text), `README release guidance missing: ${text}`);
}
```

- [ ] **Step 2: Run the validator and prove release documentation is absent**

Run:

```powershell
node plugins\codex-harness\tests\validate-harness.js
```

Expected: nonzero exit with `README release guidance missing: v0.2.0`.

- [ ] **Step 3: Update README**

Document:

- current release `v0.2.0`;
- rolling install using `--ref main`;
- reproducible install using `--ref v0.2.0`;
- CodeGraph install with `@colbymchenry/codegraph@1.2.0`;
- restart/new-thread and hook trust after update;
- both dependency-free validation commands;
- session-scoped Ponytail behavior;
- localized low-risk configuration routing;
- Implementer-only mutating verification.

Do not claim that the tag exists until publication is authorized.

- [ ] **Step 4: Add cross-platform CI**

Create `.github/workflows/validate.yml`:

```yaml
name: Validate

on:
  push:
  pull_request:

jobs:
  harness:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node plugins/codex-harness/tests/validate-harness.js
      - run: node plugins/codex-harness/tests/test-hooks.js
      - run: git diff --check
```

- [ ] **Step 5: Run the complete local verification**

Run sequentially:

```powershell
node plugins\codex-harness\tests\validate-harness.js
node plugins\codex-harness\tests\test-hooks.js
Get-ChildItem plugins\codex-harness\hooks\*.js | ForEach-Object { node --check $_.FullName }
git diff --check
git status --short
```

Expected: all checks exit zero. Status contains only files named in this plan
and the approved design/plan documents.

- [ ] **Step 6: Simulate installed-cache validation**

Copy only `plugins/codex-harness` into a temporary directory outside the
repository structure and run its `tests/validate-harness.js`.

Expected: `Harness static validation passed.` without a repository README or
marketplace file.

- [ ] **Step 7: Complete the requirement audit**

Map each of the twelve acceptance criteria in
`docs/superpowers/specs/2026-07-28-codex-harness-v0.2.0-design.md` to fresh
command output or a specific file assertion. Mark the tag/install smoke as
pending Git publication rather than claiming it passed.

- [ ] **Step 8: Final diff review**

Review for correctness, security, Windows/Linux path handling, unexpected home
writes, stale hard-coded models, unrelated changes, and unnecessary
abstractions. Leave all work uncommitted for explicit Git authorization.
