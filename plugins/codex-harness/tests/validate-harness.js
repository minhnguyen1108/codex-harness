const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => { throw new Error(message); };
const router = read('skills/harness-router/SKILL.md');
const evals = read('tests/eval-cases.md');
const hooks = JSON.parse(read('hooks/hooks.json'));
const readme = fs.readFileSync(path.join(root, '..', '..', 'README.md'), 'utf8');
if (/gpt-\d/.test(router) || /gpt-\d/.test(evals) || /gpt-\d/.test(readme)) fail('Fixed model ID remains.');
for (const text of ['Decision Agent model selection', 'available_models:', 'sole writer', 'global cap of three active child agents']) if (!router.includes(text)) fail(`Missing router rule: ${text}`);
if (!JSON.stringify(hooks).includes('harness-sync-agents.js')) fail('Profile sync hook is not registered.');
for (const [name, sandbox] of Object.entries({ 'harness-explorer.toml': 'read-only', 'harness-planner.toml': 'read-only', 'harness-implementer.toml': 'workspace-write', 'harness-reviewer.toml': 'read-only' })) {
  const profile = read(`agents/${name}`);
  if (!profile.startsWith('# managed-by: codex-harness') || profile.includes('\nmodel =') || !profile.includes(`sandbox_mode = "${sandbox}"`)) fail(`Invalid profile: ${name}`);
}
console.log('Harness static validation passed.');
