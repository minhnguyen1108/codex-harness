# Claims to Tests
| Claim category | README claim | Evidence type | Command or assertion | Notes |
| --- | --- | --- | --- | --- |
| project not publicly released | The repository is open source but this phase does not publish a public release. | static | README status text and changelog `Unreleased`. | No tag, release, PR, merge, or marketplace publication is claimed. |
| routing categories | Direct workflow covers localized docs and low-risk configuration; harness workflow covers unknown-cause, cross-module, security-sensitive, concurrency, schema, migration, dependency, and public-contract work. | static | `node plugins/codex-harness/tests/validate-harness.js` checks router text. | Routing claims match checked-in skill guidance. |
| read-only roles and sole Implementer | Explorer, Planner, and Reviewer are read-only; only Implementer writes or runs mutating verification. | static | Validator checks agent profiles and reviewer/implementer contracts. | This is a workflow contract, not a runtime sandbox guarantee outside Codex. |
| Ponytail guidance | Ponytail guidance prefers the smallest correct solution without weakening explicit requirements. | static | Validator checks active Ponytail skill files exist in the manifest. | No productivity or outcome metric is claimed. |
| optional MCP and CodeGraph opt-in | Context7 and CodeGraph are optional MCP servers; CodeGraph is opt-in and is never initialized automatically. | automated | Validator checks `.mcp.json` optional server contracts and threat model coverage. | Optional MCP servers may contact external services only when configured and used. |
| lifecycle hooks and local state writes | Lifecycle hooks require Node.js and may read or write local plugin state. | automated | `node plugins/codex-harness/tests/test-hooks.js` plus validator hook registration checks. | Hook tests cover session-scoped state behavior. |
| managed profile sync and conflict preservation | Managed agent profile sync writes plugin-owned profiles and preserves user-owned conflicts. | automated | `node plugins/codex-harness/tests/test-hooks.js`. | The test uses isolated temp `CODEX_HOME` directories. |
| secret handling | Secrets belong in environment variables or user credential stores, never in Git, issues, examples, or transcripts. | static | README, `SECURITY.md`, and threat model text. | This is repository process guidance. |
| quickstart tag caveat | Rolling install uses `--ref main`; pinned install uses `--ref v0.2.0` only after the tag exists. | static | Validator checks README release guidance strings. | Pinned install is conditional on a published tag. |
| validation and CI | Validation runs without package install and CI runs least-privilege checks on Windows and Linux. | automated | `node plugins/codex-harness/tests/validate-harness.js`, `node plugins/codex-harness/tests/test-validator.js`, workflow assertions. | CI status depends on GitHub Actions after push. |
| demo | The local demo runs without credentials and without network services. | manual | Follow `docs/validation/demo.md`. | Demo uses repository files and local commands. |
| license and attribution | Codex Harness uses MIT License and keeps Ponytail attribution in third-party files. | static | README links to `LICENSE` and `plugins/codex-harness/third_party/ponytail/SOURCE.md`. | Third-party license files remain checked in. |
| CI badge | README shows the validation workflow badge. | static | README links to `.github/workflows/validate.yml`; validator checks workflow contract. | The badge is a workflow status link, not a release signal. |
| external adoption | not claimed | Context-aware public-doc scan. | Public usage numbers are not asserted. |
| production security audit | not claimed | Context-aware public-doc scan allows this not-claimed ledger row. | No independent audit result is asserted. |
| performance benchmark | not claimed | Context-aware public-doc scan. | No performance comparison is asserted. |
| public-directory acceptance | not claimed | Context-aware public-doc scan. | No marketplace or directory acceptance is asserted. |
## Final audit
- CI badge: mapped to static workflow assertions.
- Ponytail guidance: mapped to checked-in skill files and documentation.
- lifecycle hooks require Node.js: mapped to hook registrations and hook tests.
- Install, validation, optional MCP, local execution, managed profile sync, secret handling, demo, license, attribution, and sole-writer claims have evidence rows above.
