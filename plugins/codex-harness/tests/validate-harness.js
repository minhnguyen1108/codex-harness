const fs = require('fs');
const path = require('path');
const { deepStrictEqual } = require('assert');
const pluginRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(pluginRoot, '..', '..');
const readPlugin = (file) => fs.readFileSync(path.join(pluginRoot, file), 'utf8');
const readJson = (file) => JSON.parse(readPlugin(file));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const publicDocFiles = [
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'SUPPORT.md',
  'CODE_OF_CONDUCT.md',
  'CHANGELOG.md',
  'docs/security/threat-model.md',
  'docs/validation/claims-to-tests.md',
  'docs/validation/demo.md',
  'docs/superpowers/specs/2026-08-08-oss-readiness-design.md',
  'docs/superpowers/plans/2026-08-08-oss-readiness.md',
];
const claimBearingPublicDocs = [
  'README.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'SUPPORT.md',
  'CODE_OF_CONDUCT.md',
  'CHANGELOG.md',
  'docs/security/threat-model.md',
  'docs/validation/demo.md',
];
const unsupportedClaimPattern = /\btrusted by\b|\bcustomer logos\b|\bproduction ready\b|\bsecurity audit\b|\bbenchmark (?:win|wins|superiority)\b|\bOpenAI endorsed\b/i;
function assertMarkdownLink(markdown, label, target) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert(
    new RegExp(`\\[${escapedLabel}\\]\\(${escapedTarget}\\)`).test(markdown),
    `README markdown link missing: ${label} -> ${target}`,
  );
}
function validateNoPersonalPaths() {
  for (const file of publicDocFiles) {
    const fullPath = path.join(repoRoot, file);
    if (!fs.existsSync(fullPath)) continue;
    const text = fs.readFileSync(fullPath, 'utf8');
    assert(
      !/C:\\Users\\[^\\\r\n]+|\.cache[\\/]+codex-runtimes|codex-runtimes/i.test(text),
      `Personal path found in public docs: ${file}`,
    );
  }
}
function validateUnsupportedClaims() {
  for (const file of claimBearingPublicDocs) {
    const fullPath = path.join(repoRoot, file);
    if (!fs.existsSync(fullPath)) continue;
    assert(!unsupportedClaimPattern.test(fs.readFileSync(fullPath, 'utf8')), `Unsupported public claim found in ${file}.`);
  }
}
function validatePublicDocs() {
  const readmePath = path.join(repoRoot, 'README.md');
  if (!fs.existsSync(readmePath)) return;
  const requiredCommunityFiles = [
    'SECURITY.md',
    'CONTRIBUTING.md',
    'SUPPORT.md',
    'CODE_OF_CONDUCT.md',
    'CHANGELOG.md',
    '.github/CODEOWNERS',
  ];
  for (const file of requiredCommunityFiles) {
    assert(fs.existsSync(path.join(repoRoot, file)), `Required public file missing: ${file}`);
  }
  const readme = fs.readFileSync(readmePath, 'utf8');
  assertMarkdownLink(readme, 'SECURITY.md', 'SECURITY.md');
  assertMarkdownLink(readme, 'CONTRIBUTING.md', 'CONTRIBUTING.md');
  assertMarkdownLink(readme, 'SUPPORT.md', 'SUPPORT.md');
  assertMarkdownLink(readme, 'CODE_OF_CONDUCT.md', 'CODE_OF_CONDUCT.md');
  assertMarkdownLink(readme, 'CHANGELOG.md', 'CHANGELOG.md');
  assertMarkdownLink(readme, 'docs/security/threat-model.md', 'docs/security/threat-model.md');
  assertMarkdownLink(readme, 'docs/validation/claims-to-tests.md', 'docs/validation/claims-to-tests.md');
  assertMarkdownLink(readme, 'docs/validation/demo.md', 'docs/validation/demo.md');
  assertMarkdownLink(readme, 'LICENSE', 'LICENSE');
  assertMarkdownLink(readme, 'Ponytail attribution', 'plugins/codex-harness/third_party/ponytail/SOURCE.md');
  const owners = fs.readFileSync(path.join(repoRoot, '.github/CODEOWNERS'), 'utf8');
  for (const line of [
    '* @minhnguyen1108',
    '/plugins/codex-harness/ @minhnguyen1108',
    '/.github/workflows/validate.yml @minhnguyen1108',
  ]) {
    assert(owners.includes(line), `CODEOWNERS entry missing: ${line}`);
  }
  assert(!/@(?:owner|maintainer|team)\b|<[^>]+>/.test(owners), 'CODEOWNERS contains non-real owner text.');
  const security = fs.readFileSync(path.join(repoRoot, 'SECURITY.md'), 'utf8');
  assert(
    security.includes('https://github.com/minhnguyen1108/codex-harness/security/advisories/new'),
    'Security advisory link missing.',
  );
  assert(security.includes('minimal redacted issue'), 'Security fallback issue guidance missing.');
  const support = fs.readFileSync(path.join(repoRoot, 'SUPPORT.md'), 'utf8');
  assert(/\[SECURITY\.md\]\(SECURITY\.md\)/.test(support), 'SUPPORT.md security link missing.');
}
function readRepoFile(file) {
  const fullPath = path.join(repoRoot, file);
  assert(fs.existsSync(fullPath), `Required public file missing: ${file}`);
  return fs.readFileSync(fullPath, 'utf8');
}
function validateThreatModel() {
  const threat = readRepoFile('docs/security/threat-model.md');
  for (const heading of ['Assets', 'Trust boundaries', 'Actors', 'Entry points', 'Risks', 'Mitigations', 'Residual risks']) {
    assert(threat.includes(`## ${heading}`), `Threat model section missing: ${heading}`);
  }
  for (const term of [
    'lifecycle hooks',
    'plugin metadata',
    'Context7',
    'optional MCP servers',
    'managed agent profile sync',
    'local filesystem writes',
    'user-provided prompts',
    'CodeGraph is never initialized automatically',
  ]) {
    assert(threat.includes(term), `Threat model coverage missing: ${term}`);
  }
}
function validateClaimsToTests() {
  const claims = readRepoFile('docs/validation/claims-to-tests.md');
  for (const status of ['automated', 'static', 'manual', 'not claimed']) {
    assert(claims.includes(status), `Claims mapping status missing: ${status}`);
  }
  for (const item of ['external adoption', 'production security audit', 'performance benchmark', 'public-directory acceptance']) {
    assert(claims.includes(item), `Not-claimed item missing: ${item}`);
  }
  for (const item of ['CI badge', 'Ponytail guidance', 'lifecycle hooks require Node.js', '## Final audit']) {
    assert(claims.includes(item), `Final claims audit missing: ${item}`);
  }
  for (const category of [
    'project not publicly released',
    'routing categories',
    'read-only roles and sole Implementer',
    'Ponytail guidance',
    'optional MCP and CodeGraph opt-in',
    'lifecycle hooks and local state writes',
    'managed profile sync and conflict preservation',
    'secret handling',
    'quickstart tag caveat',
    'validation and CI',
    'demo',
    'license and attribution',
  ]) {
    assert(claims.includes(category), `Claims category missing: ${category}`);
  }
}
function validateDemo() {
  const demo = readRepoFile('docs/validation/demo.md');
  for (const text of ['Prerequisites', 'Commands', 'Expected output', 'Cleanup', 'without credentials', 'without network services']) {
    assert(demo.includes(text), `Demo evidence missing: ${text}`);
  }
}
function validateWorkflow() {
  const workflow = readRepoFile('.github/workflows/validate.yml');
  for (const text of [
    'permissions:',
    'contents: read',
    'push:',
    'pull_request:',
    'ubuntu-latest',
    'windows-latest',
    'node-version: 20',
    'plugins/codex-harness/tests/validate-harness.js',
    'plugins/codex-harness/tests/test-validator.js',
    'plugins/codex-harness/tests/test-hooks.js',
    'node --check',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4',
    'fetch-depth: 0',
    'BASE_SHA: ${{ github.event.pull_request.base.sha || github.event.before }}',
    'git hash-object -t tree /dev/null',
    'git diff --check "$BASE_SHA" HEAD',
  ]) {
    assert(workflow.includes(text), `Workflow contract missing: ${text}`);
  }
  assert(!/^\s*-\s*run:\s*git diff --check\s*$/m.test(workflow), 'Workflow uses bare git diff --check.');
  assert(
    !/\bcontents:\s*write\b|\bpackages:\s*write\b|\bpull-requests:\s*write\b|upload-artifact|npm\s+(?:install|ci|i)\b|pnpm\s+(?:install|i)\b|yarn\s+(?:install|add)\b|secrets\.|context7|codegraph/i.test(workflow),
    'Workflow contains forbidden CI behavior.',
  );
}
const manifest = readJson('.codex-plugin/plugin.json');
const mcp = readJson('.mcp.json');
const prompts = [
  'Decide the safest route for this coding change.',
  'Trace this code path and identify change impact.',
  'Review this diff for over-engineering.',
];

assert(manifest.name === 'codex-harness', 'Unexpected plugin name.');
assert(manifest.version === '0.2.0', 'Plugin version must be 0.2.0.');
assert(manifest.repository === 'https://github.com/minhnguyen1108/codex-harness', 'Repository metadata mismatch.');
assert(manifest.homepage === manifest.repository, 'Homepage must match repository.');
assert(manifest.interface.shortDescription === 'Route and verify coding work', 'Short description mismatch.');
assert(JSON.stringify(manifest.interface.defaultPrompt) === JSON.stringify(prompts), 'Default prompts mismatch.');
assert(!Object.hasOwn(mcp, 'mcpServers'), 'Legacy mcpServers wrapper remains.');
deepStrictEqual(Object.keys(mcp).sort(), ['codegraph', 'context7'], 'Unexpected MCP server keys.');
deepStrictEqual(mcp.context7, {
  type: 'http',
  url: 'https://mcp.context7.com/mcp',
  env_http_headers: { CONTEXT7_API_KEY: 'CONTEXT7_API_KEY' },
  enabled_tools: ['resolve-library-id', 'query-docs'],
  default_tools_approval_mode: 'approve',
  required: false,
}, 'Context7 MCP contract mismatch.');
deepStrictEqual(mcp.codegraph, {
  type: 'stdio',
  command: 'codegraph',
  args: ['serve', '--mcp'],
  env: { CODEGRAPH_TELEMETRY: '0' },
  enabled_tools: ['codegraph_explore'],
  default_tools_approval_mode: 'approve',
  required: false,
}, 'CodeGraph MCP contract mismatch.');

assert(manifest.skills === './skills/', 'Manifest skills path mismatch.');
assert(manifest.mcpServers === './.mcp.json', 'Manifest MCP path mismatch.');
for (const entry of [manifest.skills, manifest.mcpServers]) {
  assert(entry.startsWith('./'), `Manifest path must start with ./: ${entry}`);
  const resolved = path.resolve(pluginRoot, entry);
  assert(resolved.startsWith(`${pluginRoot}${path.sep}`), `Manifest path escapes plugin root: ${entry}`);
  assert(fs.existsSync(resolved), `Manifest path missing: ${entry}`);
}
const expectedSkillFiles = [
  'skills/coding-workflow/SKILL.md',
  'skills/harness-router/SKILL.md',
  'skills/ponytail-audit/SKILL.md',
  'skills/ponytail-debt/SKILL.md',
  'skills/ponytail-gain/SKILL.md',
  'skills/ponytail-help/SKILL.md',
  'skills/ponytail-review/SKILL.md',
  'skills/ponytail/SKILL.md',
];
const skillFiles = fs.readdirSync(path.join(pluginRoot, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `skills/${entry.name}/SKILL.md`)
  .sort();
deepStrictEqual(skillFiles, expectedSkillFiles, 'Active manifest skill files mismatch.');
for (const file of expectedSkillFiles) {
  assert(fs.existsSync(path.join(pluginRoot, file)), `Expected skill file missing: ${file}`);
}
const marketplacePath = path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');
if (fs.existsSync(marketplacePath)) {
  const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
  const [plugin] = marketplace.plugins;
  assert(marketplace.name === 'codex-harness', 'Marketplace name mismatch.');
  assert(marketplace.plugins.length === 1 && plugin.name === 'codex-harness', 'Marketplace plugin mismatch.');
  assert(plugin.source.path === './plugins/codex-harness', 'Marketplace source path mismatch.');
  assert(plugin.policy.installation === 'AVAILABLE', 'Marketplace installation policy mismatch.');
  assert(plugin.policy.authentication === 'ON_INSTALL', 'Marketplace authentication policy mismatch.');
  assert(plugin.category === 'Productivity', 'Marketplace category mismatch.');
  const resolved = path.resolve(repoRoot, plugin.source.path);
  assert(resolved.startsWith(`${repoRoot}${path.sep}`) && fs.existsSync(resolved), 'Marketplace path invalid.');
}
const profiles = {
  'harness-explorer.toml': {
    sandbox: 'read-only',
    required: ['harness_explorer', 'Never spawn agents'],
  },
  'harness-planner.toml': {
    sandbox: 'read-only',
    required: ['harness_planner', 'never spawn agents'],
  },
  'harness-implementer.toml': {
    sandbox: 'workspace-write',
    required: ['harness_implementer', 'sole writer'],
  },
  'harness-reviewer.toml': {
    sandbox: 'read-only',
    required: ['harness_reviewer', 'mutating verification'],
  },
};
const profileFiles = fs.readdirSync(path.join(pluginRoot, 'agents'))
  .filter((file) => file.endsWith('.toml'))
  .sort();
deepStrictEqual(profileFiles, Object.keys(profiles).sort(), 'Active agent profile files mismatch.');
const profileText = [];
for (const [file, spec] of Object.entries(profiles)) {
  const profile = readPlugin(`agents/${file}`);
  profileText.push(profile);
  assert(profile.startsWith('# managed-by: codex-harness'), `Missing managed marker: ${file}`);
  const sandbox = profile.match(/^sandbox_mode\s*=\s*"([^"]+)"\s*$/m);
  assert(sandbox && sandbox[1] === spec.sandbox, `Invalid sandbox_mode for ${file}: ${spec.sandbox}`);
  for (const text of spec.required) assert(profile.includes(text), `Invalid profile ${file}: ${text}`);
}
const activeText = [
  ...expectedSkillFiles.map((file) => [file, readPlugin(file)]),
  ...Object.keys(profiles).map((file, index) => [`agents/${file}`, profileText[index]]),
  ['tests/eval-cases.md', readPlugin('tests/eval-cases.md')],
];
const readmePath = path.join(repoRoot, 'README.md');
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  activeText.push(['README.md', readme]);
  for (const text of [
    'v0.2.0',
    '--ref main',
    '--ref v0.2.0',
    '@colbymchenry/codegraph@1.2.0',
    'node plugins/codex-harness/tests/test-hooks.js',
    'node plugins/codex-harness/tests/test-validator.js',
  ]) {
    assert(readme.includes(text), `README release guidance missing: ${text}`);
  }
}
validatePublicDocs();
validateNoPersonalPaths();
validateUnsupportedClaims();
if (fs.existsSync(readmePath)) {
  validateThreatModel();
  validateClaimsToTests();
  validateDemo();
  validateWorkflow();
}
for (const [file, text] of activeText) {
  assert(!/gpt-\d/i.test(text), `Fixed model ID remains: ${file}`);
  assert(
    !/^\s*(?:model|model_reasoning_effort|reasoning_effort)\s*[:=]/mi.test(text),
    `Fixed model setting remains: ${file}`,
  );
}
const router = readPlugin('skills/harness-router/SKILL.md');
const hooks = readJson('hooks/hooks.json');
for (const text of ['Decision Agent model selection', 'available_models:', 'sole writer', 'global cap of three active child agents']) if (!router.includes(text)) fail(`Missing router rule: ${text}`);
for (const text of [
  'localized, low-risk configuration',
  'snapshot before and after every read-only phase',
  'Only one Implementer may be active',
  'confirm it has stopped before replacement',
  'mutating verification',
]) {
  assert(router.includes(text), `Missing router rule: ${text}`);
}
const hookSpecs = {
  SessionStart: [
    { script: 'harness-sync-agents.js', matcher: 'startup|resume|clear|compact', timeout: 5 },
    { script: 'ponytail-activate.js', matcher: 'startup|resume|clear|compact', timeout: 5 },
  ],
  UserPromptSubmit: [
    { script: 'ponytail-mode-tracker.js', timeout: 5 },
  ],
  SubagentStart: [
    { script: 'ponytail-subagent.js', timeout: 5 },
  ],
  SessionEnd: [
    { script: 'ponytail-cleanup.js', timeout: 3 },
  ],
};
const nodeCheck = "if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error 'Node.js is required by codex-harness hooks'; exit 1 }";
deepStrictEqual(Object.keys(hooks.hooks).sort(), Object.keys(hookSpecs).sort(), 'Unexpected hook events.');
for (const [event, expected] of Object.entries(hookSpecs)) {
  const registrations = hooks.hooks[event];
  assert(registrations.length === expected.length, `Unexpected ${event} registration count.`);
  expected.forEach((spec, index) => {
    const registration = registrations[index];
    if (spec.matcher) {
      assert(registration.matcher === spec.matcher, `Invalid ${event} matcher: ${spec.script}`);
    } else {
      assert(!Object.hasOwn(registration, 'matcher'), `Unexpected ${event} matcher: ${spec.script}`);
    }
    assert(registration.hooks.length === 1, `Unexpected ${event} hook count: ${spec.script}`);
    const hook = registration.hooks[0];
    assert(hook.type === 'command', `Invalid ${event} hook type: ${spec.script}`);
    assert(hook.timeout === spec.timeout, `Invalid ${event} timeout: ${spec.script}`);
    assert(hook.command === `node "\${PLUGIN_ROOT}/hooks/${spec.script}"`, `Invalid ${event} command: ${spec.script}`);
    assert(hook.commandWindows === `${nodeCheck}; node "$env:PLUGIN_ROOT\\hooks\\${spec.script}"`, `Invalid ${event} Windows command: ${spec.script}`);
  });
}
const implementer = readPlugin('agents/harness-implementer.toml');
assert(implementer.includes('RED/GREEN evidence only for behavior changes; use static validation for documentation or declarative configuration.'), 'Missing Implementer conditional verification contract.');
const reviewer = readPlugin('agents/harness-reviewer.toml');
assert(reviewer.includes('run only read-only checks. Request mutating verification reruns through the same Implementer.'), 'Missing Reviewer verification ownership contract.');
const hooksSource = readPlugin('hooks/hooks.json');
const runtimeSource = readPlugin('hooks/ponytail-runtime.js');
assert(hooksSource.includes('ponytail-cleanup.js'), 'SessionEnd cleanup hook is not registered.');
assert(!hooksSource.includes('CLAUDE_PLUGIN_ROOT'), 'Legacy CLAUDE_PLUGIN_ROOT remains.');
assert(hooksSource.includes('PLUGIN_ROOT'), 'Native PLUGIN_ROOT is missing.');
assert(runtimeSource.includes('session_id'), 'Runtime does not validate session_id.');
assert(runtimeSource.includes('getStatePath'), 'Runtime does not expose session-scoped state paths.');
console.log('Harness static validation passed.');
