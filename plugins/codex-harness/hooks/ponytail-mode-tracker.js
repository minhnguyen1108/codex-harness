#!/usr/bin/env node
const { getDefaultMode, isDeactivationCommand } = require('./ponytail-config');
const { readHookInput, setMode, writeHookOutput } = require('./ponytail-runtime');

async function main() {
  const data = await readHookInput();
  const sessionId = data.session_id;
  const prompt = (data.prompt || '').trim().toLowerCase();

  if (/^[/@$]ponytail/.test(prompt)) {
    const parts = prompt.split(/\s+/);
    const cmd = parts[0].replace(/^[@$]/, '/');
    const arg = parts[1] || '';
    let mode = null;

    if (cmd === '/ponytail-review' || cmd === '/ponytail:ponytail-review') {
      mode = 'review';
    } else if (cmd === '/ponytail' || cmd === '/ponytail:ponytail') {
      if (['lite', 'full', 'ultra', 'off'].includes(arg)) mode = arg;
      else mode = getDefaultMode();
    }

    if (mode) {
      setMode(mode, sessionId);
      writeHookOutput(
        'UserPromptSubmit',
        mode,
        mode === 'off' ? 'PONYTAIL MODE OFF' : 'PONYTAIL MODE CHANGED — level: ' + mode,
      );
    }
  }

  if (isDeactivationCommand(prompt)) {
    setMode('off', sessionId);
    writeHookOutput('UserPromptSubmit', 'off', 'PONYTAIL MODE OFF');
  }
}

main().catch((error) => {
  process.stderr.write(`CODEX_HARNESS_HOOK_FAILED:${error.message}`);
  process.exitCode = 1;
});
