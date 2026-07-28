const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const hooksDir = path.join(pluginRoot, 'hooks');
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-harness-hooks-'));

function run(script, input, extraEnv = {}) {
  return childProcess.spawnSync(process.execPath, [path.join(hooksDir, script)], {
    cwd: pluginRoot,
    env: { ...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: dataDir, ...extraEnv },
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
}

function assertSuccess(result) {
  assert.strictEqual(result.status, 0, result.stderr);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

try {
  process.env.PLUGIN_DATA = dataDir;
  process.env.PONYTAIL_DEFAULT_MODE = 'full';
  delete require.cache[require.resolve('../hooks/ponytail-runtime')];
  const { readMode } = require('../hooks/ponytail-runtime');
  const sessionA = 'session-a';
  const sessionB = 'session-b';

  assertSuccess(run('ponytail-activate.js', { session_id: sessionA, source: 'startup' }));
  assert.strictEqual(readMode(sessionA), 'full');

  assertSuccess(run('ponytail-mode-tracker.js', {
    session_id: sessionA,
    prompt: '/ponytail ultra',
  }));
  assert.strictEqual(readMode(sessionA), 'ultra');

  assertSuccess(run('ponytail-activate.js', { session_id: sessionB, source: 'startup' }));
  assert.strictEqual(readMode(sessionB), 'full');
  assert.strictEqual(readMode(sessionA), 'ultra');

  assertSuccess(run('ponytail-activate.js', { session_id: sessionA, source: 'compact' }));
  assert.strictEqual(readMode(sessionA), 'ultra');

  assertSuccess(run('ponytail-mode-tracker.js', {
    session_id: sessionA,
    prompt: 'stop ponytail',
  }));
  assert.strictEqual(readMode(sessionA), 'off');

  assertSuccess(run('ponytail-activate.js', { session_id: sessionA, source: 'resume' }));
  assert.strictEqual(readMode(sessionA), 'off');

  const activeSubagent = run('ponytail-subagent.js', {
    session_id: sessionB,
    source: 'SubagentStart',
  });
  const activeSubagentOutput = assertSuccess(activeSubagent);
  assert.match(
    activeSubagentOutput.hookSpecificOutput.additionalContext,
    /PONYTAIL MODE ACTIVE.+full/s,
  );

  const inactiveSubagent = run('ponytail-subagent.js', {
    session_id: sessionA,
    source: 'SubagentStart',
  });
  assertSuccess(inactiveSubagent);
  assert.strictEqual(inactiveSubagent.stdout, '');

  assertSuccess(run('ponytail-mode-tracker.js', {
    session_id: sessionB,
    prompt: '/ponytail ultra',
  }));
  assert.strictEqual(readMode(sessionB), 'ultra');
  assertSuccess(run('ponytail-activate.js', { session_id: sessionB, source: 'clear' }));
  assert.strictEqual(readMode(sessionB), 'full');

  assertSuccess(run('ponytail-cleanup.js', {
    session_id: sessionA,
    source: 'SessionEnd',
  }));
  assert.strictEqual(readMode(sessionA), null);
  assert.strictEqual(readMode(sessionB), 'full');

  const stateBeforeInvalidInput = fs.readdirSync(dataDir).sort();
  const missingSession = run('ponytail-activate.js', { source: 'startup' });
  assert.notStrictEqual(missingSession.status, 0);
  assert.match(missingSession.stderr, /CODEX_HARNESS_HOOK_FAILED:PONYTAIL_SESSION_ID_REQUIRED/);
  assert.deepStrictEqual(fs.readdirSync(dataDir).sort(), stateBeforeInvalidInput);
  assert(!fs.existsSync(path.join(dataDir, '.ponytail-active')));

  const malformedSession = childProcess.spawnSync(
    process.execPath,
    [path.join(hooksDir, 'ponytail-mode-tracker.js')],
    {
      cwd: pluginRoot,
      env: { ...process.env, PLUGIN_ROOT: pluginRoot, PLUGIN_DATA: dataDir },
      input: '{',
      encoding: 'utf8',
    },
  );
  assert.notStrictEqual(malformedSession.status, 0);
  assert.match(malformedSession.stderr, /CODEX_HARNESS_HOOK_FAILED:/);
  assert.deepStrictEqual(fs.readdirSync(dataDir).sort(), stateBeforeInvalidInput);

  const profileNames = [
    'harness-explorer.toml',
    'harness-implementer.toml',
    'harness-planner.toml',
    'harness-reviewer.toml',
  ];
  const cleanCodexHome = path.join(dataDir, 'clean-codex-home');
  const firstSync = run('harness-sync-agents.js', {}, { CODEX_HOME: cleanCodexHome });
  assertSuccess(firstSync);
  assert.strictEqual(firstSync.stdout, '');
  for (const name of profileNames) {
    assert.strictEqual(
      fs.readFileSync(path.join(cleanCodexHome, 'agents', name), 'utf8'),
      fs.readFileSync(path.join(pluginRoot, 'agents', name), 'utf8'),
    );
  }

  const conflictCodexHome = path.join(dataDir, 'conflict-codex-home');
  const conflictDir = path.join(conflictCodexHome, 'agents');
  const conflictName = 'harness-reviewer.toml';
  const userProfile = '# user-owned\nname = "custom-reviewer"\n';
  fs.mkdirSync(conflictDir, { recursive: true });
  fs.writeFileSync(path.join(conflictDir, conflictName), userProfile);

  const conflictSync = run('harness-sync-agents.js', {}, { CODEX_HOME: conflictCodexHome });
  const warning = assertSuccess(conflictSync);
  assert.strictEqual(
    warning.systemMessage,
    `CODEX_HARNESS_PROFILE_CONFLICT:${conflictName}`,
  );
  assert.strictEqual(fs.readFileSync(path.join(conflictDir, conflictName), 'utf8'), userProfile);

  const profilesAfterFirstConflictSync = Object.fromEntries(
    profileNames.map((name) => [name, fs.readFileSync(path.join(conflictDir, name), 'utf8')]),
  );
  const secondConflictSync = run('harness-sync-agents.js', {}, {
    CODEX_HOME: conflictCodexHome,
  });
  assertSuccess(secondConflictSync);
  assert.deepStrictEqual(
    Object.fromEntries(
      profileNames.map((name) => [name, fs.readFileSync(path.join(conflictDir, name), 'utf8')]),
    ),
    profilesAfterFirstConflictSync,
  );

  const invalidCodexHome = path.join(dataDir, 'not-a-directory');
  fs.writeFileSync(invalidCodexHome, 'occupied');
  const failedSync = run('harness-sync-agents.js', {}, { CODEX_HOME: invalidCodexHome });
  assert.notStrictEqual(failedSync.status, 0);
  assert.match(
    JSON.parse(failedSync.stdout).systemMessage,
    /^CODEX_HARNESS_PROFILE_SYNC_FAILED:/,
  );

  console.log('Harness hook tests passed.');
} finally {
  fs.rmSync(dataDir, { recursive: true, force: true });
}
