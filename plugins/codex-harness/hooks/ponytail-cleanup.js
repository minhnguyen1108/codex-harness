#!/usr/bin/env node
const { clearMode, readHookInput } = require('./ponytail-runtime');

readHookInput()
  .then(({ session_id: sessionId }) => clearMode(sessionId))
  .catch((error) => {
    process.stderr.write(`CODEX_HARNESS_HOOK_FAILED:${error.message}`);
    process.exitCode = 1;
  });
