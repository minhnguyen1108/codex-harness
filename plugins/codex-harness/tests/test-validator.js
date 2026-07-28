const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-harness-validator-'));

function assertRejected(name, mutate) {
  const copy = path.join(tempRoot, name);
  fs.cpSync(pluginRoot, copy, { recursive: true });
  mutate(copy);
  const result = childProcess.spawnSync(process.execPath, [path.join(copy, 'tests', 'validate-harness.js')], {
    cwd: copy,
    encoding: 'utf8',
  });
  assert.notStrictEqual(result.status, 0, `${name} mutation passed validation`);
}

try {
  assertRejected('unexpected-profile', (copy) => {
    fs.writeFileSync(
      path.join(copy, 'agents', 'harness-unreviewed.toml'),
      '# managed-by: codex-harness\nname = "harness_unreviewed"\nmodel = "gpt-5.6"\n',
    );
  });

  assertRejected('miswired-hook', (copy) => {
    const file = path.join(copy, 'hooks', 'hooks.json');
    const hooks = JSON.parse(fs.readFileSync(file, 'utf8'));
    hooks.hooks.UserPromptSubmit[0].hooks[0].command = 'node "${PLUGIN_ROOT}/hooks/missing.js" # ponytail-mode-tracker.js';
    fs.writeFileSync(file, `${JSON.stringify(hooks, null, 2)}\n`);
  });

  assertRejected('miswired-windows-hook', (copy) => {
    const file = path.join(copy, 'hooks', 'hooks.json');
    const hooks = JSON.parse(fs.readFileSync(file, 'utf8'));
    hooks.hooks.UserPromptSubmit[0].hooks[0].commandWindows = 'node missing.js # ponytail-mode-tracker.js';
    fs.writeFileSync(file, `${JSON.stringify(hooks, null, 2)}\n`);
  });

  console.log('Harness validator mutation tests passed.');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
