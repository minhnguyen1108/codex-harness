# OSS Readiness Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Make Codex Harness easier to inspect, install, validate, and contribute to with public evidence that matches the repository's actual state.
**Architecture:** Keep plugin behavior unchanged and add public docs, community files, dependency-free validation, and least-privilege CI around the existing package. README claims are backed by validator checks, claims mapping, threat-model coverage, and a local demo that uses only repository files.
**Tech Stack:** Markdown, GitHub Actions YAML, `.github/CODEOWNERS`, dependency-free CommonJS on Node.js 20, and public commands that use `node`.
## Global Constraints
- Owner for repository-wide files and plugin package is `@minhnguyen1108`.
- Public docs are English-first and falsifiable.
- No public release tag, GitHub release, pull request, merge, push, or marketplace publication in this phase.
- No new runtime, development, CI, or documentation dependencies.
- No CodeGraph initialization, generated graph artifacts, or required CodeGraph workflow.
- No changes to plugin behavior.
- No fabricated usage numbers, customer logos, benchmark wins, public security-audit claims, production-ready claims, or external endorsement claims.
- No legal policy beyond contribution, support, conduct, and security process docs.
- CI runs on `push` and `pull_request` with top-level `permissions: contents: read`.
- CI uses Node 20 on `ubuntu-latest` and `windows-latest`.
- CI does not install packages, request write tokens, upload artifacts, require secrets, or call external services beyond checkout/setup actions.
- Context7 and CodeGraph are optional MCP servers; CodeGraph remains opt-in and is never initialized automatically.
- Contributors use Node.js in `PATH`; no package install is required.
- Secrets belong in environment variables or user credential stores, never in Git, issues, examples, logs, or docs transcripts.
- Preserve unrelated user changes.
## Exact File Map
- Create: `SECURITY.md` for reporting channels, supported branch/tag policy, secret handling, and threat-model link.
- Create: `CONTRIBUTING.md` for setup, validation commands, TDD/static validation, docs standards, dependency policy, and unrelated-change preservation.
- Create: `SUPPORT.md` for usage questions, bug reports, security routing, and honest support expectations.
- Create: `CODE_OF_CONDUCT.md` for concise conduct rules and enforcement contacts.
- Create: `CHANGELOG.md` with `Unreleased` and OSS readiness entries without release dates.
- Create: `.github/CODEOWNERS` assigning `@minhnguyen1108`.
- Create: `.github/workflows/validate.yml` initially for the README CI badge and later harden it for least-privilege Windows/Linux validation.
- Create: `docs/security/threat-model.md` for assets, trust boundaries, actors, entry points, risks, mitigations, and residual risks.
- Create: `docs/validation/claims-to-tests.md` mapping README claims to `automated`, `static`, `manual`, or `not claimed`.
- Create: `docs/validation/demo.md` for a reproducible local demo/evaluation without credentials or network services.
- Modify: `README.md` as the English-first public entrypoint with CI badge, quickstart, security model, validation, demo, contribution, support, license, and attribution.
- Modify: `plugins/codex-harness/tests/validate-harness.js` to enforce docs, links, claim language, CI permissions, CODEOWNERS, and metadata invariants.
- Modify: `plugins/codex-harness/tests/test-validator.js` to add mutation tests for new validator checks.
---
### Task 1: README, community files, CODEOWNERS, and validator coverage
**Files:**
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `SUPPORT.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `CHANGELOG.md`
- Create: `.github/CODEOWNERS`
- Create: `.github/workflows/validate.yml`
- Modify: `README.md`
- Modify: `plugins/codex-harness/tests/validate-harness.js`
- Modify: `plugins/codex-harness/tests/test-validator.js`
**Interfaces:**
- Consumes: repo root, existing plugin metadata, `assert(condition, message)` in `validate-harness.js`, and `assertRejected(name, mutate)` in `test-validator.js`.
- Produces: `validatePublicDocs()` called only when repo `README.md` exists, so installed-cache validation still works.
- Produces: README link text for `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `docs/security/threat-model.md`, `docs/validation/claims-to-tests.md`, and `docs/validation/demo.md`; Task 1 requires only community files and CODEOWNERS to exist.
- Produces: `.github/CODEOWNERS` entries for `*`, `/plugins/codex-harness/`, and `/.github/workflows/validate.yml`, all owned by `@minhnguyen1108`.
- [ ] **Step 1: Write the failing public-docs validator**
Add `validatePublicDocs()`:
```js
const requiredCommunityFiles = [
  'SECURITY.md', 'CONTRIBUTING.md', 'SUPPORT.md', 'CODE_OF_CONDUCT.md',
  'CHANGELOG.md', '.github/CODEOWNERS',
];
for (const file of requiredCommunityFiles) {
  assert(fs.existsSync(path.join(repoRoot, file)), `Required public file missing: ${file}`);
}
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
for (const link of ['SECURITY.md', 'CONTRIBUTING.md', 'SUPPORT.md', 'CODE_OF_CONDUCT.md', 'CHANGELOG.md', 'docs/security/threat-model.md', 'docs/validation/claims-to-tests.md', 'docs/validation/demo.md']) {
  assert(readme.includes(link), `README link text missing: ${link}`);
}
assert(!/\btrusted by\b|\bcustomer logos\b|\bproduction ready\b|\bsecurity audit\b|\bbenchmark (?:win|wins|superiority)\b|\bOpenAI endorsed\b/i.test(readme), 'Unsupported public claim found in README.');
const owners = fs.readFileSync(path.join(repoRoot, '.github/CODEOWNERS'), 'utf8');
for (const line of ['* @minhnguyen1108', '/plugins/codex-harness/ @minhnguyen1108', '/.github/workflows/validate.yml @minhnguyen1108']) {
  assert(owners.includes(line), `CODEOWNERS entry missing: ${line}`);
}
assert(!/@(?:owner|maintainer|team)\b|<[^>]+>/.test(owners), 'CODEOWNERS contains non-real owner text.');
```
- [ ] **Step 2: Add validator mutation tests**
Extend `test-validator.js` so `assertRejected()` can mutate a full temp repo copy, then add failing cases for removing `SECURITY.md`, appending `Production ready with benchmark wins.` to `README.md`, and replacing CODEOWNERS with `* @owner`.
- [ ] **Step 3: Run RED evidence**
Run:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
```
Expected: nonzero validator exit with `Required public file missing: SECURITY.md`; mutation tests fail until the helper copies repo-root files.
- [ ] **Step 4: Write minimal public docs**
Replace `README.md` with sections for project identity/status, CI badge, what it does, quickstart, common use cases, security model, validation/demo, contributing/support, and license/third-party attribution. Include link text for Task 2 evidence docs, but do not require those files to exist yet. Create the five community files with concrete process text, consistent support/security contacts, and no unsupported maturity, audit, adoption, benchmark, or endorsement claims.
- [ ] **Step 5: Write CODEOWNERS**
Create `.github/workflows/validate.yml` as a temporary README badge target with `name: Validate`, `on: [push, pull_request]`, and a single validator step. Task 3 hardens its permissions, matrix, syntax checks, and forbidden-behavior assertions.
Create `.github/CODEOWNERS`:
```text
* @minhnguyen1108
/plugins/codex-harness/ @minhnguyen1108
/.github/workflows/validate.yml @minhnguyen1108
```
- [ ] **Step 6: Run GREEN evidence**
Run:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
```
Expected: `Harness static validation passed.` and `Harness validator mutation tests passed.`
- [ ] **Step 7: REFACTOR evidence and commit**
Run:
```powershell
git diff --check
git status --short
```
Expected: whitespace check exits zero; status shows only Task 1 files plus already approved files from earlier tasks. Commit message: `docs: add OSS community entrypoint`.
---
### Task 2: Threat model, claims mapping, demo, and validator tests
**Files:**
- Create: `docs/security/threat-model.md`
- Create: `docs/validation/claims-to-tests.md`
- Create: `docs/validation/demo.md`
- Modify: `README.md`
- Modify: `plugins/codex-harness/tests/validate-harness.js`
- Modify: `plugins/codex-harness/tests/test-validator.js`
**Interfaces:**
- Consumes: README claim text from Task 1 and existing validator helpers.
- Produces: `validateThreatModel()`, `validateClaimsToTests()`, and `validateDemo()` in `validate-harness.js`.
- Produces: a local demo using only repository validation commands, no credentials, and no network services.
- [ ] **Step 1: Write failing validator checks**
Add assertions:
```js
const threat = fs.readFileSync(path.join(repoRoot, 'docs/security/threat-model.md'), 'utf8');
for (const heading of ['Assets', 'Trust boundaries', 'Actors', 'Entry points', 'Risks', 'Mitigations', 'Residual risks']) {
  assert(threat.includes(`## ${heading}`), `Threat model section missing: ${heading}`);
}
for (const term of ['lifecycle hooks', 'plugin metadata', 'optional MCP servers', 'managed agent profile sync', 'local filesystem writes', 'user-provided prompts', 'CodeGraph is never initialized automatically']) {
  assert(threat.includes(term), `Threat model coverage missing: ${term}`);
}
const claims = fs.readFileSync(path.join(repoRoot, 'docs/validation/claims-to-tests.md'), 'utf8');
for (const status of ['automated', 'static', 'manual', 'not claimed']) assert(claims.includes(status), `Claims mapping status missing: ${status}`);
for (const item of ['external adoption', 'production security audit', 'performance benchmark', 'public-directory acceptance']) assert(claims.includes(item), `Not-claimed item missing: ${item}`);
const demo = fs.readFileSync(path.join(repoRoot, 'docs/validation/demo.md'), 'utf8');
for (const text of ['Prerequisites', 'Commands', 'Expected output', 'Cleanup', 'without credentials', 'without network services']) assert(demo.includes(text), `Demo evidence missing: ${text}`);
```
- [ ] **Step 2: Add mutation tests**
Add mutations that remove `Residual risks`, remove `not claimed`, and change demo text to require credentials. Each mutation must fail validation.
- [ ] **Step 3: Run RED evidence**
Run:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
```
Expected: nonzero validator exit with the first missing threat-model, claims, or demo assertion.
- [ ] **Step 4: Write evidence docs**
Create `docs/security/threat-model.md` with assets, trust boundaries, actors, entry points, risks, mitigations, and residual risks. Cover lifecycle hooks, plugin metadata, optional MCP servers, managed agent profile sync, local filesystem writes, user-provided prompts, Context7, CodeGraph, and the sentence `CodeGraph is never initialized automatically`.
Create `docs/validation/claims-to-tests.md` as a table with columns `README claim`, `Evidence type`, `Command or assertion`, and `Notes`. Include rows for external adoption, production security audit, performance benchmark, and public-directory acceptance as `not claimed`.
Create `docs/validation/demo.md` with prerequisites, commands, expected output, cleanup, and a route-selection/manual scenario. Its commands are the bundled-Node validator, mutation test, and hook test.
- [ ] **Step 5: Run GREEN evidence**
Run:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
```
Expected: `Harness static validation passed.` and `Harness validator mutation tests passed.`
- [ ] **Step 6: REFACTOR evidence and commit**
Run:
```powershell
git diff --check
git status --short
```
Expected: whitespace check exits zero; status shows only Task 1 and Task 2 approved files. Commit message: `docs: map OSS readiness claims to evidence`.
---
### Task 3: Least-privilege CI and JavaScript syntax checks
**Files:**
- Modify: `.github/workflows/validate.yml`
- Modify: `plugins/codex-harness/tests/validate-harness.js`
- Modify: `plugins/codex-harness/tests/test-validator.js`
**Interfaces:**
- Consumes: validators and JavaScript files under `plugins/codex-harness/hooks/*.js` and `plugins/codex-harness/tests/*.js`.
- Produces: a hardened GitHub Actions workflow that runs local validators, syntax checks, and `git diff --check` with read-only contents permission on Windows and Linux.
- Produces: validator checks rejecting broader permissions, package installs, artifact upload, secrets, and Context7/CodeGraph network-service calls.
- [ ] **Step 1: Write failing CI validator**
Add assertions:
```js
const workflowPath = path.join(repoRoot, '.github/workflows/validate.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');
for (const text of ['permissions:', 'contents: read', 'push:', 'pull_request:', 'ubuntu-latest', 'windows-latest', 'node-version: 20', 'plugins/codex-harness/tests/validate-harness.js', 'plugins/codex-harness/tests/test-validator.js', 'plugins/codex-harness/tests/test-hooks.js', 'node --check', 'git diff --check']) {
  assert(workflow.includes(text), `Workflow contract missing: ${text}`);
}
assert(!/\bcontents:\s*write\b|\bpackages:\s*write\b|\bpull-requests:\s*write\b|upload-artifact|npm install|npm ci|secrets\.|context7|codegraph/i.test(workflow), 'Workflow contains forbidden CI behavior.');
```
- [ ] **Step 2: Add mutation tests**
Add workflow mutations for `contents: write`, `npm install`, `actions/upload-artifact`, removing `windows-latest`, and removing a `node --check` command. Each mutation must fail validation.
- [ ] **Step 3: Run RED evidence**
Run:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
```
Expected: nonzero validator exit for the existing workflow with `Workflow contract missing: permissions:` or `Workflow contract missing: node --check`.
- [ ] **Step 4: Harden workflow**
Modify the existing `.github/workflows/validate.yml` to:
```yaml
name: Validate
on:
  push:
  pull_request:
permissions:
  contents: read
jobs:
  validate:
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
      - run: node plugins/codex-harness/tests/test-validator.js
      - run: node plugins/codex-harness/tests/test-hooks.js
      - shell: pwsh
        run: Get-ChildItem plugins/codex-harness/hooks/*.js | ForEach-Object { node --check $_.FullName }
      - shell: pwsh
        run: Get-ChildItem plugins/codex-harness/tests/*.js | ForEach-Object { node --check $_.FullName }
      - run: git diff --check
```
- [ ] **Step 5: Run GREEN evidence**
Run:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
Get-ChildItem plugins\codex-harness\hooks\*.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem plugins\codex-harness\tests\*.js | ForEach-Object { node --check $_.FullName }
git diff --check
```
Expected: validator and mutation tests print pass messages, every syntax check exits zero, and `git diff --check` exits zero.
- [ ] **Step 6: REFACTOR evidence and commit**
Inspect the workflow and validator diff for no package installs, write permissions, artifact uploads, secrets, Context7 calls, CodeGraph calls, or dependency files. Commit message: `ci: validate OSS readiness with least privilege`.
---
### Task 4: Final claims audit, bundled-Node verification, and scope review
**Files:**
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `CONTRIBUTING.md`
- Modify: `SUPPORT.md`
- Modify: `CODE_OF_CONDUCT.md`
- Modify: `CHANGELOG.md`
- Modify: `.github/CODEOWNERS`
- Modify: `.github/workflows/validate.yml`
- Modify: `docs/security/threat-model.md`
- Modify: `docs/validation/claims-to-tests.md`
- Modify: `docs/validation/demo.md`
- Modify: `plugins/codex-harness/tests/validate-harness.js`
- Modify: `plugins/codex-harness/tests/test-validator.js`
**Interfaces:**
- Consumes: every public claim and all validation commands from Tasks 1-3.
- Produces: final evidence that README, threat model, claims mapping, demo, workflow, CODEOWNERS, and validators match the OSS readiness design.
- Produces: final implementation report with changed files, RED/GREEN/REFACTOR evidence, verification commands, and remaining risks.
- [ ] **Step 1: Audit README claims**
For each README section, add or update one row in `docs/validation/claims-to-tests.md`. Use `automated` for validator/test command evidence, `static` for checked file assertions, `manual` for human review scenarios, and `not claimed` for external adoption, production security audit, performance benchmark, and public-directory acceptance.
- [ ] **Step 2: Check forbidden wording**
Run:
```powershell
rg -n -i "trusted by|customer logos|production ready|security audit|benchmark wins|benchmark superiority|OpenAI endorsed" README.md SECURITY.md CONTRIBUTING.md SUPPORT.md CODE_OF_CONDUCT.md CHANGELOG.md docs/security/threat-model.md docs/validation/demo.md
```
Expected: no output and exit code `1` from `rg` because no claim-bearing public doc matches. Separately inspect `docs/validation/claims-to-tests.md` and allow rows where the evidence type is `not claimed`.
- [ ] **Step 3: Run full bundled-Node verification**
Run sequentially:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
node plugins/codex-harness/tests/test-hooks.js
Get-ChildItem plugins\codex-harness\hooks\*.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem plugins\codex-harness\tests\*.js | ForEach-Object { node --check $_.FullName }
git diff --check
git status --short
```
Expected outputs include:
```text
Harness static validation passed.
Harness validator mutation tests passed.
Harness hook tests passed.
```
Every syntax check exits zero. `git diff --check` exits zero. `git status --short` lists only approved docs, CI, and validation files.
- [ ] **Step 4: Scope review**
Run:
```powershell
git diff --name-only
git diff -- plugins/codex-harness/hooks plugins/codex-harness/skills plugins/codex-harness/agents plugins/codex-harness/.codex-plugin plugins/codex-harness/.mcp.json
```
Expected: first command lists only the file map in this plan. Second command has no output; plugin behavior, skills, hooks, agents, manifest, and MCP config are unchanged.
- [ ] **Step 5: Verify no dependency or CodeGraph artifacts**
Run:
```powershell
git diff --name-only | rg -n "package-lock.json|pnpm-lock.yaml|yarn.lock|package.json|\.codegraph"
```
Expected: no output and exit code `1` from `rg`.
- [ ] **Step 6: Final self-review and commit**
Confirm README links, community files, CI permission, existing validator pass state, threat-model sections, claims mapping, local demo, forbidden-claim absence, no dependency addition, no CodeGraph initialization, and scoped final diff. Commit message: `docs: audit OSS readiness evidence`.
