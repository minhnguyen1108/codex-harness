# Codex Harness Threat Model
## Assets
- Repository source files, plugin metadata, skills, hooks, tests, and documentation.
- Local Codex plugin data used by lifecycle hooks.
- Managed agent profiles synchronized by the plugin.
- User prompts, command output, and local filesystem writes made during coding workflows.
- Secrets stored outside Git in environment variables or user credential stores.
## Trust boundaries
- Codex invokes lifecycle hooks through the local plugin system.
- Hook scripts cross from plugin code into local plugin data paths.
- Managed agent profile sync crosses from the plugin package into `CODEX_HOME`.
- Optional MCP servers cross from local Codex into external services only when configured and used.
- The repository boundary separates checked-in files from user-owned local state.
## Actors
- Repository maintainer `@minhnguyen1108`.
- Contributors who edit docs, validation, hooks, or plugin metadata.
- Codex users who install and run the plugin locally.
- External services exposed through optional MCP servers.
## Entry points
- README quickstart commands and update commands.
- Plugin metadata and optional MCP configuration.
- lifecycle hooks registered in `plugins/codex-harness/hooks/hooks.json`.
- managed agent profile sync through `harness-sync-agents.js`.
- user-provided prompts routed through direct or harness workflow instructions.
- local filesystem writes performed by the sole Implementer role.
## Risks
- A hook writes outside intended plugin data or managed profile locations.
- Plugin metadata points outside the package root.
- Optional MCP servers receive secrets or private repository details.
- A reviewer or read-only role performs mutating verification.
- A public README claim overstates adoption, release status, evidence, or maturity.
- User-owned agent profiles are overwritten during managed agent profile sync.
## Mitigations
- Dependency-free validators check plugin paths, hook wiring, profile ownership, README claims, and public docs.
- The harness workflow states that only the Implementer writes or runs mutating verification.
- Managed agent profile sync preserves files without the plugin-owned marker.
- Context7 is documented for public library names, versions, and API questions only.
- CodeGraph is optional, opt-in, and CodeGraph is never initialized automatically.
- Secrets are documented as environment-variable or credential-store values, never Git content.
## Residual risks
- Local users decide whether to trust plugin lifecycle hooks.
- Optional MCP server behavior depends on the configured external service.
- Manual review is still needed before tags, releases, marketplace publication, or broad public announcements.
