const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getClaudeDir } = require('./ponytail-config');

const STATE_FILE = '.ponytail-active';
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

let stateDir = getClaudeDir();
if (isCodex) stateDir = process.env.PLUGIN_DATA;
if (isCopilot) stateDir = process.env.COPILOT_PLUGIN_DATA;

function getStatePath(sessionId) {
  if (!isCodex) return path.join(stateDir, STATE_FILE);
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('PONYTAIL_SESSION_ID_REQUIRED');
  }
  const key = crypto.createHash('sha256').update(sessionId).digest('hex');
  return path.join(stateDir, `ponytail-${key}.mode`);
}

function setMode(mode, sessionId) {
  const statePath = getStatePath(sessionId);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode);
}

function clearMode(sessionId) {
  try {
    fs.unlinkSync(getStatePath(sessionId));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function readMode(sessionId) {
  try {
    return fs.readFileSync(getStatePath(sessionId), 'utf8').trim() || null;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

function readHookInput() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(input.replace(/^\uFEFF/, ''));
        if (!data.session_id) throw new Error('PONYTAIL_SESSION_ID_REQUIRED');
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
    process.stdin.on('error', reject);
  });
}

function writeHookOutput(event, mode, context = '') {
  if (isCopilot) {
    // Copilot reads additionalContext on SessionStart; ignores output elsewhere.
    process.stdout.write(JSON.stringify(
      event === 'SessionStart' && context ? { additionalContext: context } : {}));
    return;
  }
  if (isCodex) {
    const output = { systemMessage: `PONYTAIL:${mode.toUpperCase()}` };
    if (context) {
      output.hookSpecificOutput = {
        hookEventName: event,
        additionalContext: context,
      };
    }
    process.stdout.write(JSON.stringify(output));
    return;
  }
  // Native Claude: SessionStart accepts raw stdout, but SubagentStart needs the
  // hookSpecificOutput JSON form or the context is dropped.
  if (event === 'SubagentStart') {
    process.stdout.write(JSON.stringify(
      { hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
    return;
  }
  process.stdout.write(context);
}

module.exports = {
  clearMode,
  getStatePath,
  isCodex,
  isCopilot,
  readHookInput,
  readMode,
  setMode,
  writeHookOutput,
};
