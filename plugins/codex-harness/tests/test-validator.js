const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(pluginRoot, '..', '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-harness-validator-'));

function assertRejected(name, expectedMessage, mutate) {
  const repoCopy = path.join(tempRoot, name);
  fs.cpSync(repoRoot, repoCopy, {
    recursive: true,
    filter: (source) => path.basename(source) !== '.git',
  });
  const copy = path.join(repoCopy, 'plugins', 'codex-harness');
  mutate(copy);
  const result = childProcess.spawnSync(process.execPath, [path.join(copy, 'tests', 'validate-harness.js')], {
    cwd: copy,
    encoding: 'utf8',
  });
  assert.notStrictEqual(result.status, 0, `${name} mutation passed validation`);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, new RegExp(expectedMessage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${name} failure message mismatch`);
}

try {
  assertRejected('unexpected-profile', 'Active agent profile files mismatch.', (copy) => {
    fs.writeFileSync(
      path.join(copy, 'agents', 'harness-unreviewed.toml'),
      '# managed-by: codex-harness\nname = "harness_unreviewed"\nmodel = "gpt-5.6"\n',
    );
  });

  assertRejected('miswired-hook', 'Invalid UserPromptSubmit command: ponytail-mode-tracker.js', (copy) => {
    const file = path.join(copy, 'hooks', 'hooks.json');
    const hooks = JSON.parse(fs.readFileSync(file, 'utf8'));
    hooks.hooks.UserPromptSubmit[0].hooks[0].command = 'node "${PLUGIN_ROOT}/hooks/missing.js" # ponytail-mode-tracker.js';
    fs.writeFileSync(file, `${JSON.stringify(hooks, null, 2)}\n`);
  });

  assertRejected('miswired-windows-hook', 'Invalid UserPromptSubmit Windows command: ponytail-mode-tracker.js', (copy) => {
    const file = path.join(copy, 'hooks', 'hooks.json');
    const hooks = JSON.parse(fs.readFileSync(file, 'utf8'));
    hooks.hooks.UserPromptSubmit[0].hooks[0].commandWindows = 'node missing.js # ponytail-mode-tracker.js';
    fs.writeFileSync(file, `${JSON.stringify(hooks, null, 2)}\n`);
  });

  assertRejected('missing-security-doc', 'Required public file missing: SECURITY.md', (copy) => {
    fs.rmSync(path.join(copy, '..', '..', 'SECURITY.md'), { force: true });
  });

  assertRejected('unsupported-readme-claim', 'Unsupported public claim found in README.md.', (copy) => {
    fs.appendFileSync(path.join(copy, '..', '..', 'README.md'), '\nProduction ready with benchmark wins.\n');
  });

  assertRejected('bad-codeowners-owner', 'CODEOWNERS entry missing: * @minhnguyen1108', (copy) => {
    fs.writeFileSync(path.join(copy, '..', '..', '.github', 'CODEOWNERS'), '* @owner\n');
  });

  assertRejected('missing-residual-risks', 'Threat model section missing: Residual risks', (copy) => {
    const file = path.join(copy, '..', '..', 'docs', 'security', 'threat-model.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('## Residual risks', '## Remaining exposure'));
  });

  assertRejected('missing-not-claimed-status', 'Claims mapping status missing: not claimed', (copy) => {
    const file = path.join(copy, '..', '..', 'docs', 'validation', 'claims-to-tests.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/not claimed/g, 'not asserted'));
  });

  assertRejected('demo-requires-credentials', 'Demo evidence missing: without credentials', (copy) => {
    const file = path.join(copy, '..', '..', 'docs', 'validation', 'demo.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('without credentials', 'with credentials'));
  });

  assertRejected('workflow-write-permission', 'Workflow contract missing: contents: read', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('contents: read', 'contents: write'));
  });

  assertRejected('workflow-npm-install', 'Workflow contains forbidden CI behavior.', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.appendFileSync(file, '\n      - run: npm install\n');
  });

  assertRejected('workflow-upload-artifact', 'Workflow contains forbidden CI behavior.', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.appendFileSync(file, '\n      - uses: actions/upload-artifact@v4\n');
  });

  assertRejected('workflow-missing-windows', 'Workflow contract missing: windows-latest', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('windows-latest', 'macos-latest'));
  });

  assertRejected('workflow-missing-syntax-check', 'Workflow contract missing: node --check', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/node --check/g, 'node syntax-check-disabled'));
  });

  assertRejected('public-doc-personal-path', 'Personal path found in public docs: docs/validation/demo.md', (copy) => {
    fs.appendFileSync(path.join(copy, '..', '..', 'docs', 'validation', 'demo.md'), '\nC:\\Users\\example-user\\.cache\\codex-runtimes\\runtime\\node.exe\n');
  });

  assertRejected('security-unsupported-claim', 'Unsupported public claim found in SECURITY.md.', (copy) => {
    fs.appendFileSync(path.join(copy, '..', '..', 'SECURITY.md'), '\nTrusted by developers.\n');
  });

  assertRejected('demo-unsupported-claim', 'Unsupported public claim found in docs/validation/demo.md.', (copy) => {
    fs.appendFileSync(path.join(copy, '..', '..', 'docs', 'validation', 'demo.md'), '\nProduction ready with benchmark wins.\n');
  });

  assertRejected('readme-markdown-link-target', 'README markdown link missing: SECURITY.md -> SECURITY.md', (copy) => {
    const file = path.join(copy, '..', '..', 'README.md');
    fs.writeFileSync(fs.realpathSync(file), fs.readFileSync(file, 'utf8').replace('[SECURITY.md](SECURITY.md)', '[SECURITY.md](security.html)'));
  });

  assertRejected('security-advisory-link', 'Security advisory link missing.', (copy) => {
    const file = path.join(copy, '..', '..', 'SECURITY.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('https://github.com/minhnguyen1108/codex-harness/security/advisories/new', 'https://github.com/minhnguyen1108/codex-harness/issues'));
  });

  assertRejected('missing-context7-threat-model', 'Threat model coverage missing: Context7', (copy) => {
    const file = path.join(copy, '..', '..', 'docs', 'security', 'threat-model.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/Context7/g, 'Docs MCP'));
  });

  assertRejected('workflow-bare-diff-check', 'Workflow uses bare git diff --check.', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.appendFileSync(file, '\n      - run: git diff --check\n');
  });

  assertRejected('workflow-unpinned-checkout', 'Workflow contract missing: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4', 'actions/checkout@v4'));
  });

  assertRejected('workflow-pnpm-install', 'Workflow contains forbidden CI behavior.', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.appendFileSync(file, '\n      - run: pnpm install\n');
  });

  assertRejected('workflow-yarn-add', 'Workflow contains forbidden CI behavior.', (copy) => {
    const file = path.join(copy, '..', '..', '.github', 'workflows', 'validate.yml');
    fs.appendFileSync(file, '\n      - run: yarn add left-pad\n');
  });

  console.log('Harness validator mutation tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
