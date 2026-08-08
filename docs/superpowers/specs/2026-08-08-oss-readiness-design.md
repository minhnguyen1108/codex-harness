# OSS Readiness Design

## Goals

Improve truthful public evidence for OpenAI Codex for Open Source by making the
repository easier to inspect, install, validate, and contribute to without
overstating adoption, maturity, security guarantees, or external endorsement.

The work should produce:

- an English-first public README with a CI badge, quickstart, concrete use
  cases, and a clear security model;
- standard community health files: `SECURITY.md`, `CONTRIBUTING.md`,
  `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, and
  `.github/CODEOWNERS`;
- hardened least-privilege GitHub Actions validation for docs, metadata, and
  the existing dependency-free plugin checks;
- a public threat model for the Codex Harness plugin and its optional MCP
  integrations;
- a claims-to-tests validation document that maps public README claims to
  executable checks, static assertions, or explicitly manual evidence;
- one small reproducible demo/evaluation that a new contributor can run locally
  without network credentials and without fabricated adoption metrics.

## Non-Goals

- No public release tag, GitHub release, pull request, merge, or marketplace
  publication in this phase.
- No new runtime, development, CI, or documentation dependencies.
- No CodeGraph initialization, generated graph artifacts, or required CodeGraph
  workflow.
- No fabricated usage numbers, customer logos, benchmark wins, security audit
  claims, or "production ready" claims without matching evidence.
- No changes to plugin behavior unless a later implementation task explicitly
  approves them.
- No legal policy beyond repository-level contribution, support, conduct, and
  security process documentation.

## Architecture and File Responsibilities

The repository keeps the existing Codex Harness plugin layout and adds public
documentation around it. The implementation should prefer small Markdown,
YAML, and dependency-free Node updates that reuse the current
`plugins/codex-harness/tests/validate-harness.js` style.

`README.md`

- Be English-first and the main public entrypoint.
- Show a GitHub Actions CI badge only after `.github/workflows/validate.yml`
  exists.
- Explain what Codex Harness does: routes coding work, keeps read-only analysis
  separate from the sole writer, verifies changes, applies Ponytail, and uses
  optional Context7/CodeGraph only when appropriate.
- Include quickstart commands for rolling `main` installation and pinned tag
  installation, while stating that pinned install requires the tag to exist.
- Include small use cases rather than broad productivity or adoption claims.
- Link to security, support, contribution, changelog, threat model, and
  claims-to-tests documents.

`SECURITY.md`

- State supported reporting channels and expected maintainer response process.
- Document that secrets must not be posted in issues or committed to the repo.
- Describe supported versions by branch/tag policy without claiming unsupported
  maintenance promises.
- Link to the public threat model.

`CONTRIBUTING.md`

- Explain the minimal local setup: Node.js in `PATH`; no package install.
- List required validation commands and the TDD/static-validation expectation.
- State that contributors must preserve unrelated changes and avoid adding
  dependencies without an explicit design decision.
- Describe docs standards: English-first public docs, no adoption claims without
  evidence, no secrets in examples.

`SUPPORT.md`

- Define where to ask usage questions, where to report bugs, and when to use
  the security channel.
- Keep support expectations honest for an open source repository maintained by
  volunteers or the current maintainer.

`CODE_OF_CONDUCT.md`

- Use a concise contributor covenant style policy or similarly standard conduct
  text already allowed by the repository license posture.
- Keep enforcement contacts consistent with `SUPPORT.md` and `SECURITY.md`.

`CHANGELOG.md`

- Start with `Unreleased`.
- Record the OSS readiness documentation and CI hardening as planned or landed
  entries once implementation happens.
- Avoid release dates for unpublished versions.

`.github/CODEOWNERS`

- Assign ownership for repository-wide files and the plugin package.
- Use real maintainers only. If a real GitHub handle is not confirmed during
  implementation, stop and ask rather than inventing one.

`.github/workflows/validate.yml`

- Run on `push` and `pull_request`.
- Set least privilege with top-level `permissions: contents: read`.
- Use Node 20 on `ubuntu-latest` and `windows-latest`.
- Run the existing dependency-free Node validators, syntax checks, markdown
  metadata checks, and `git diff --check`.
- Do not install packages, request write tokens, upload artifacts, or call
  external services.

`docs/security/threat-model.md`

- Describe assets, trust boundaries, actors, entry points, risks, mitigations,
  and residual risks.
- Cover lifecycle hooks, plugin metadata, optional MCP servers, managed agent
  profile sync, local filesystem writes, and user-provided prompts.
- State that Context7 and CodeGraph are optional and that CodeGraph is never
  initialized automatically.

`docs/validation/claims-to-tests.md`

- Map each public claim in `README.md` to one of:
  `automated`, `static`, `manual`, or `not claimed`.
- Include the command or file assertion that supports each automated/static
  claim.
- Mark external adoption, production security audit, performance benchmark, and
  public-directory acceptance claims as `not claimed`.

`docs/validation/demo.md`

- Provide one reproducible local demo/evaluation using only repository files.
- Prefer a short route-selection/manual scenario plus validation-command
  transcript expectations over a fabricated benchmark.
- State prerequisites, exact commands, expected outputs, and cleanup.

`plugins/codex-harness/tests/validate-harness.js`

- Extend only if needed to enforce public metadata and docs invariants.
- Keep it dependency-free CommonJS.
- Validate required community/docs files exist, README links are present, CI
  uses least privilege, and unsupported public claims are absent.

## Content Requirements

Public wording must be specific and falsifiable. Prefer:

- "Runs dependency-free validation with Node.js 20 on Windows and Linux."
- "Optional Context7 and CodeGraph integrations are configured as optional MCP
  servers."
- "Only the Implementer role is allowed to write in the harness workflow."

Avoid:

- "Trusted by developers" without public evidence.
- "Secure by default" without scoped explanation.
- "Production ready" without release, support, threat model, and validation
  evidence.
- "OpenAI endorsed" or similar affiliation claims unless supported by an
  authoritative source.

The README should include these sections:

1. Project identity and status.
2. CI badge.
3. What it does.
4. Quickstart.
5. Common use cases.
6. Security model.
7. Validation and demo.
8. Contributing and support.
9. License and third-party attribution.

The security model section should explain local execution plainly:

- lifecycle hooks run through the Codex plugin system;
- Node.js is required for hooks and validators;
- optional MCP servers may contact external services only when configured and
  used;
- secrets belong in environment variables or user credential stores, never in
  Git;
- CodeGraph remains opt-in and is not initialized automatically.

## CI and Security Behavior

The CI workflow should be intentionally narrow:

```yaml
permissions:
  contents: read
```

Required checks:

- `node plugins/codex-harness/tests/validate-harness.js`
- `node plugins/codex-harness/tests/test-validator.js`
- `node plugins/codex-harness/tests/test-hooks.js`
- JavaScript syntax checks for `plugins/codex-harness/hooks/*.js` and
  `plugins/codex-harness/tests/*.js`
- a small dependency-free docs metadata check, either added to
  `validate-harness.js` or kept as a separate checked-in Node script;
- `git diff --check`

The docs metadata check should fail when:

- a required community health file is missing;
- README lacks links to security, support, contribution, changelog, threat
  model, claims-to-tests, or demo documentation;
- README includes unsupported adoption, benchmark, audit, or endorsement
  language;
- `.github/workflows/validate.yml` requests permissions beyond read-only
  contents without a documented reason;
- `.github/CODEOWNERS` contains placeholder owners.

The workflow must not:

- install npm packages;
- use write permissions;
- upload artifacts;
- require secrets;
- call Context7, CodeGraph, or any network service beyond GitHub Actions'
  checkout/setup actions.

## Test Strategy

Use documentation static validation rather than inventing behavioral tests for
prose. The RED/GREEN/REFACTOR evidence for implementation should be:

RED:

- Add or run a focused validation check that fails because the OSS readiness
  docs, links, CI least-privilege policy, or claim mapping are missing.
- Capture the exact failing command and first relevant failure.

GREEN:

- Add the minimal required docs and validation updates.
- Run the same focused check and confirm it exits zero.

REFACTOR:

- Tighten wording, remove duplication, and run the full validation suite.
- Confirm `git diff --check` and `git status --short` show only approved files.
- Run forbidden-wording scans against claim-bearing public docs, excluding
  `docs/superpowers`, and allow `docs/validation/claims-to-tests.md` rows whose
  evidence type is `not claimed`.

Full local verification after implementation:

```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
node plugins/codex-harness/tests/test-hooks.js
Get-ChildItem plugins\codex-harness\hooks\*.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem plugins\codex-harness\tests\*.js | ForEach-Object { node --check $_.FullName }
git diff --check
git status --short
```

If a check is not available on a contributor machine, the implementation report
must state that limitation and cite the strongest completed alternative.

## Rollout

1. Land the design spec.
2. Implement docs and validation in a later change without adding dependencies.
3. Run full local verification.
4. Let GitHub Actions validate the same checks on Windows and Linux.
5. Review the claims-to-tests document against the README before any release
   tag or marketplace-facing announcement.
6. Only after explicit authorization, create any tag, release, pull request, or
   public publication.

Rollback is straightforward because the change is documentation and CI only:
revert the affected docs/CI commit and keep the existing plugin package
unchanged.

## Success Criteria

- README is English-first and links to all community, security, validation, and
  demo documents.
- Community health files exist and contain no placeholders.
- CI runs with `contents: read` permissions on Windows and Linux.
- Existing plugin validators still pass without new dependencies.
- Public threat model names assets, trust boundaries, mitigations, and residual
  risks.
- Claims-to-tests maps every material README claim to evidence or marks it as
  not claimed.
- Demo/evaluation is reproducible locally without credentials or network
  services.
- No README or docs language claims adoption, public security audit, benchmark
  superiority, or external endorsement without evidence.
- No CodeGraph initialization or dependency addition is introduced.
- Final diff for implementation contains only approved docs, CI, and validation
  files.

## Self-Review Checklist

- No placeholders, unfinished-work markers, invented owner handles, dates for unpublished
  releases, or fake metrics.
- No contradiction between README claims, threat model, and claims-to-tests.
- No CI permission broader than `contents: read` unless separately justified.
- No new dependencies or package-manager files.
- No tag, release, pull request, merge, or CodeGraph initialization.
