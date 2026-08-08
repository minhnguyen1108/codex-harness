# Local Demo
## Prerequisites
- Run from the repository root.
- Use Node.js in `PATH`.
- The demo runs without credentials and without network services.
## Commands
```powershell
node plugins/codex-harness/tests/validate-harness.js
node plugins/codex-harness/tests/test-validator.js
node plugins/codex-harness/tests/test-hooks.js
```
## Expected output
```text
Harness static validation passed.
Harness validator mutation tests passed.
Harness hook tests passed.
```
## Manual route scenario
- A README wording change with clear acceptance criteria should use the direct workflow.
- A cross-module authentication change or security-sensitive configuration change should use the harness workflow.
- A reviewer request for a generated build must be routed back to the Implementer because mutating verification belongs to the sole writer.
## Cleanup
No repository cleanup is required. The validator mutation and hook tests create temporary directories and remove them when they finish.
