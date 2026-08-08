# Security Policy
## Reporting
Report security-sensitive behavior through GitHub Security Advisories: https://github.com/minhnguyen1108/codex-harness/security/advisories/new. If that channel is unavailable, open only a minimal redacted issue requesting private coordination. Do not post secrets, credentials, private logs, or exploit details in public issues.
## Response Process
The maintainer reviews incoming reports, asks for a minimal reproduction when needed, and coordinates fixes in the repository before public discussion. Response timing depends on maintainer availability; this repository does not make a paid support promise.
## Supported Versions
The `main` branch is the active development line. Tagged versions are supported only when the repository owner has published the tag and explicitly keeps it maintained.
## Secret Handling
Secrets belong in environment variables or user credential stores. Do not commit secrets, paste them into issues, or include them in examples.
## Threat Model
The public threat model is maintained in `docs/security/threat-model.md`.
