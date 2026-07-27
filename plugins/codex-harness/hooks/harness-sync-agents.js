#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

const marker = '# managed-by: codex-harness';
const sourceDir = path.join(__dirname, '..', 'agents');
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const targetDir = path.join(codexHome, 'agents');
const warn = (message) => process.stdout.write(JSON.stringify({ systemMessage: message }));

try {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const name of fs.readdirSync(sourceDir).filter((file) => file.endsWith('.toml'))) {
    const source = fs.readFileSync(path.join(sourceDir, name), 'utf8');
    const target = path.join(targetDir, name);
    if (fs.existsSync(target) && !fs.readFileSync(target, 'utf8').startsWith(marker)) {
      warn(`CODEX_HARNESS_PROFILE_CONFLICT:${name}`);
      continue;
    }
    const temporary = `${target}.tmp-${process.pid}`;
    fs.writeFileSync(temporary, source);
    fs.renameSync(temporary, target);
  }
} catch (error) {
  warn(`CODEX_HARNESS_PROFILE_SYNC_FAILED:${error.message}`);
}
