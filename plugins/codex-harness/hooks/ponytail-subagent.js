#!/usr/bin/env node
const { getPonytailInstructions } = require('./ponytail-instructions');
const { readHookInput, readMode, writeHookOutput } = require('./ponytail-runtime');

async function main() {
  const { session_id: sessionId } = await readHookInput();
  const mode = readMode(sessionId);
  if (mode && mode !== 'off') {
    writeHookOutput('SubagentStart', mode, getPonytailInstructions(mode));
  }
}

main().catch((error) => {
  process.stderr.write(`CODEX_HARNESS_HOOK_FAILED:${error.message}`);
  process.exitCode = 1;
});
