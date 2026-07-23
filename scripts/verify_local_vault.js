#!/usr/bin/env node
/**
 * PC / Mac: verify real Obsidian Local REST vault against folder contract (BACKLOG D1·D2).
 *
 * Usage (Obsidian + Local REST running):
 *   OBSIDIAN_API_KEY='...' node scripts/verify_local_vault.js
 *
 * Optional env:
 *   OBSIDIAN_BASE_URL=http://127.0.0.1:27123
 *   OBSIDIAN_PATH_PREFIX=           # or Project_English
 *   OBSIDIAN_LEARNER_ID=me
 *   OBSIDIAN_TRY_PREFIXES=1         # also try empty ↔ Project_English
 *
 * Exit codes: 0 pass · 1 fail · 2 skipped (no API key / unreachable host in CI)
 */
const path = require('path');
const sync = require(path.join(__dirname, '..', 'src', 'domain', 'obsidian-sync.js'));

const API_KEY = String(process.env.OBSIDIAN_API_KEY || '').trim();
const BASE_URL = String(process.env.OBSIDIAN_BASE_URL || 'http://127.0.0.1:27123').replace(/\/$/, '');
const PATH_PREFIX = String(process.env.OBSIDIAN_PATH_PREFIX || '').replace(/^\/+|\/+$/g, '');
const LEARNER_ID = String(process.env.OBSIDIAN_LEARNER_ID || 'me').trim() || 'me';
const TRY_PREFIXES = String(process.env.OBSIDIAN_TRY_PREFIXES || '1') !== '0';

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function runWithPrefix(pathPrefix) {
  const client = sync.createLocalRestClient({
    adapter: 'local-rest',
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    pathPrefix,
  });
  const result = await sync.verifyVaultContract(client, { learnerId: LEARNER_ID, probe: true });
  return { pathPrefix, result };
}

async function main() {
  if (!API_KEY) {
    log('SKIP: set OBSIDIAN_API_KEY to run real vault verification on your PC.');
    log('Example:');
    log("  OBSIDIAN_API_KEY='your-key' node scripts/verify_local_vault.js");
    log('Docs: docs/DAY_LOOP.md (D1·D2)');
    process.exit(2);
  }

  log(`Local REST base: ${BASE_URL}`);
  log(`Learner: ${LEARNER_ID}`);
  log(`Primary pathPrefix: ${PATH_PREFIX || '(empty)'}`);

  const prefixes = [PATH_PREFIX];
  if (TRY_PREFIXES) {
    for (const alt of ['', 'Project_English']) {
      if (!prefixes.includes(alt)) prefixes.push(alt);
    }
  }

  let best = null;
  for (const prefix of prefixes) {
    try {
      const report = await runWithPrefix(prefix);
      log(`\n--- pathPrefix=${prefix || '(empty)'} ---`);
      log(`folder contract: ${report.result.ready ? 'PASS' : 'FAIL'}`);
      report.result.checks.forEach((check) => {
        log(`  ${check.ok ? '✓' : '✗'} ${check.path}`);
      });
      if (report.result.probe) {
        log(`  probe ${report.result.probe.ok ? '✓' : '✗'} ${report.result.probe.path}${report.result.probe.deleted ? ' (cleaned)' : ''}`);
        if (report.result.probe.error) log(`    ${report.result.probe.error}`);
      }
      if (report.result.listErrors?.length) {
        report.result.listErrors.forEach((err) => log(`  list error ${err.dir}: ${err.error}`));
      }
      if (report.result.ready) {
        if (!best || prefix === PATH_PREFIX) best = report;
      } else if (!best) {
        best = report;
      }
    } catch (error) {
      const message = String(error.message || error);
      log(`\n--- pathPrefix=${prefix || '(empty)'} ---`);
      log(`ERROR: ${message}`);
      if (/ECONNREFUSED|fetch failed|network/i.test(message)) {
        log('Obsidian Local REST가 꺼져 있거나 이 환경에서 127.0.0.1에 닿지 않습니다.');
        log('Mac에서 Obsidian을 연 뒤 Local REST(HTTP 27123)를 켜고 다시 실행하세요.');
        process.exit(2);
      }
    }
  }

  if (!best || !best.result.ready) {
    log('\nRESULT: FAIL — vault folder contract not satisfied.');
    log('Fix: create Learners/<id>/{Learning,Gaps} and Library/{Drafts,Canon} under the Local REST vault root');
    log('(or set pathPrefix=Project_English when the vault root is the parent of Project_English).');
    log('SoT: docs/OBSIDIAN_VAULT_EVOLUTION.md');
    process.exit(1);
  }

  log(`\nRESULT: PASS with pathPrefix=${best.pathPrefix || '(empty)'}`);
  if (best.pathPrefix !== PATH_PREFIX) {
    log(`Tip: 앱 성장 화면 Path prefix에 "${best.pathPrefix || '(비움)'}" 을(를) 넣으세요.`);
  }
  log('Next: 앱에서 간극 저장 → 자동 sync → Vault 확인 → 가져오기 → Next Practice (DAY_LOOP checklist).');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
