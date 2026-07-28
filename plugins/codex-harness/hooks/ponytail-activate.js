#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { getDefaultMode, getClaudeDir, isShellSafe } = require('./ponytail-config');
const { getPonytailInstructions } = require('./ponytail-instructions');
const {
  isCodex,
  isCopilot,
  readHookInput,
  readMode,
  setMode,
  writeHookOutput,
} = require('./ponytail-runtime');

const settingsPath = path.join(getClaudeDir(), 'settings.json');

async function main() {
  const { session_id: sessionId, source } = await readHookInput();
  const defaultMode = getDefaultMode();
  const mode = (source === 'resume' || source === 'compact')
    ? readMode(sessionId) || defaultMode
    : defaultMode;
  setMode(mode, sessionId);

  if (mode === 'off') {
    writeHookOutput('SessionStart', mode, (isCodex || isCopilot) ? '' : 'OK');
    return;
  }

  let output = getPonytailInstructions(mode);

  if (!isCodex && !isCopilot) try {
    let hasStatusline = false;
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, '');
      hasStatusline = Boolean(JSON.parse(raw).statusLine);
    }

    if (!hasStatusline) {
      const isWindows = process.platform === 'win32';
      const scriptName = isWindows ? 'ponytail-statusline.ps1' : 'ponytail-statusline.sh';
      const scriptPath = path.join(__dirname, scriptName);
      if (isShellSafe(scriptPath)) {
        const command = isWindows
          ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
          : `bash "${scriptPath}"`;
        const statusLineSnippet =
          '"statusLine": { "type": "command", "command": ' + JSON.stringify(command) + ' }';
        output += '\n\n' +
          'STATUSLINE SETUP NEEDED: The ponytail plugin includes a statusline badge showing active mode ' +
          '(e.g. [PONYTAIL], [PONYTAIL:ULTRA]). It is not configured yet. ' +
          'To enable, add this to ~/.claude/settings.json: ' +
          statusLineSnippet + ' ' +
          'Proactively offer to set this up for the user on first interaction.';
      } else {
        output += '\n\n' +
          'STATUSLINE SETUP NEEDED: The ponytail plugin includes a statusline badge showing active mode. ' +
          'Its install path contains characters unsafe to embed in a shell command, so configure it manually: ' +
          'add a statusLine command of type "command" that runs ' + scriptName +
          " from the plugin's hooks directory to ~/.claude/settings.json, quoting/escaping the path for your shell. " +
          'Proactively offer to set this up for the user on first interaction.';
      }
    }
  } catch (e) {
    // Statusline setup is advisory and must not block session activation.
  }

  writeHookOutput('SessionStart', mode, output);
}

main().catch((error) => {
  process.stderr.write(`CODEX_HARNESS_HOOK_FAILED:${error.message}`);
  process.exitCode = 1;
});
