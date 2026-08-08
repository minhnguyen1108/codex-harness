# Contributing
## Local Setup
Install Node.js so `node` is available in `PATH`. No package install is required for repository validation.
## Validation
Run these commands before proposing changes:
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
node plugins/codex-harness/tests/test-hooks.js
```
Use RED, GREEN, and REFACTOR evidence for behavior changes. Use static validation for documentation and declarative configuration changes.
## Change Scope
Preserve unrelated changes. Do not add dependencies without an explicit design decision. Do not initialize CodeGraph unless a task explicitly authorizes it.
## Documentation Standards
Public docs are English-first. Claims must be specific and backed by validation, static assertions, or manual evidence. Do not add adoption claims, fake metrics, unsupported maturity language, or secrets in examples.
