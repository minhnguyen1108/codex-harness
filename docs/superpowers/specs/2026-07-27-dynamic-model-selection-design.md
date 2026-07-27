# Dynamic Model Selection Design

## Goal

Make Harness Router's internal Decision Agent select models dynamically from the models that Codex reports as available for the current task. The plugin must not hard-code model identifiers.

## Design

Decision Agent decides model assignments after it has assessed the goal, risk, route, and available models. It records the decision internally:

```yaml
decision:
  available_models: [models reported by Codex]
  assignments:
    explorer: available model suited to read-heavy analysis
    planner: available model suited to synthesis
    implementer: available model suited to implementation
    reviewer: available model suited to high-confidence review
  fallbacks: [reason a task model is used when no role-specific override is available]
```

For a `direct` route, no role assignment is needed; the Decision Agent uses the current task model. For a `harness` route, it selects an available model appropriate to each role and the task's risk. It must use only models advertised by Codex, preserve the existing reasoning-intent tiers (fast analysis, balanced implementation, high-confidence review), and avoid model IDs or assumed availability.

If Codex does not expose an available-model list or cannot honor a role override, the Decision Agent uses the parent task model, records the fallback internally, and continues only if the existing safety boundary remains intact. It must not ask the user to choose a model unless the user's explicit preference is required for a material product constraint.

## Files

- Modify `plugins/codex-harness/skills/harness-router/SKILL.md` to replace fixed model names with Decision Agent model-selection rules.
- Modify `plugins/codex-harness/tests/eval-cases.md` with dynamic selection and fallback cases.

## Verification

Use targeted static checks to prove that no hard-coded model IDs remain, Decision Agent owns selection, the direct route avoids unnecessary role assignment, and fallback to the task model is explicit.

## Non-goals

- Adding a model discovery API, a registry, or a dependency.
- Persisting model choices across tasks.
- Overriding Codex platform availability or safety restrictions.
