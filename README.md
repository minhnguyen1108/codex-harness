# Codex Harness
[![Validate](https://github.com/minhnguyen1108/codex-harness/actions/workflows/validate.yml/badge.svg)](https://github.com/minhnguyen1108/codex-harness/actions/workflows/validate.yml)
Codex Harness is a Codex plugin for routing coding work, separating read-only analysis from the sole writer, verifying changes, and applying Ponytail's smallest-correct-change guidance. It is maintained as an open source repository and is not published as a public release in this phase.
## Status
The current package metadata is `v0.2.0`. The rolling installation path uses `main`. The pinned installation path uses `v0.2.0` only after that Git tag exists.
## What It Does
- Routes localized documentation and low-risk configuration through a direct workflow.
- Routes unknown-cause, cross-module, security-sensitive, concurrency, schema, migration, dependency, and public-contract work through the harness workflow.
- Keeps Explorer, Planner, and Reviewer roles read-only.
- Allows only the Implementer role to write files or run mutating verification.
- Uses Ponytail to prefer the smallest correct solution without weakening explicit requirements.
- Configures Context7 and CodeGraph as optional MCP servers; CodeGraph is opt-in and is never initialized automatically.
## Quickstart
Install the rolling version from `main`:
```powershell
codex plugin marketplace add minhnguyen1108/codex-harness --ref main
codex plugin add codex-harness@codex-harness
```
Install a pinned version after the tag exists:
```powershell
codex plugin marketplace add minhnguyen1108/codex-harness --ref v0.2.0
codex plugin add codex-harness@codex-harness
```
Optional CodeGraph CLI install for repositories where you choose to use CodeGraph:
```powershell
npm install -g @colbymchenry/codegraph@1.2.0
```
After install or update, restart Codex, trust the plugin lifecycle hooks when prompted, and open a new thread.
## Common Use Cases
- Ask for a direct README or docs update with clear acceptance criteria.
- Ask for a harness workflow when a bug spans multiple modules or the cause is unknown.
- Ask for review of a diff for correctness, scope, security, compatibility, and over-engineering.
- Use `ponytail full` or `ponytail ultra` when you want stricter smallest-correct-change guidance.
## Security Model
Codex Harness runs locally through the Codex plugin system. Lifecycle hooks require Node.js and may read or write plugin state under the Codex plugin data paths. Managed agent profile sync writes only files owned by the plugin marker and preserves user-owned conflicts.
Optional MCP servers may contact external services only when configured and used. Context7 should receive only public library names, versions, and API questions. CodeGraph remains opt-in and is not initialized automatically.
Secrets belong in environment variables or user credential stores, never in Git, issues, examples, or transcripts. Read [SECURITY.md](SECURITY.md) and [docs/security/threat-model.md](docs/security/threat-model.md) before reporting security-sensitive behavior.
## Validation and Demo
Run the dependency-free checks:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
node plugins/codex-harness/tests/test-hooks.js
```
The validation evidence is mapped in [docs/validation/claims-to-tests.md](docs/validation/claims-to-tests.md). A local no-credential walkthrough is documented in [docs/validation/demo.md](docs/validation/demo.md).
## Contributing and Support
Read [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, validation commands, and documentation standards. Read [SUPPORT.md](SUPPORT.md) for usage questions and bug-report routing. Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for contributor conduct expectations. Changes are summarized in [CHANGELOG.md](CHANGELOG.md).
## License and Attribution
Codex Harness is released under the MIT License in [LICENSE](LICENSE). [Ponytail attribution](plugins/codex-harness/third_party/ponytail/SOURCE.md) and license files are kept under `plugins/codex-harness/third_party/ponytail/`.
