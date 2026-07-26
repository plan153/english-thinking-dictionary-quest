#!/usr/bin/env node
/**
 * Mac / PC: scan real Obsidian English-brain Markdown and print an optimization report.
 *
 * Prerequisites: Obsidian + Local REST API (HTTP 27123) running.
 *
 * Usage:
 *   OBSIDIAN_API_KEY='...' node scripts/analyze_vault_md.js
 *
 * Optional env:
 *   OBSIDIAN_BASE_URL=http://127.0.0.1:27123
 *   OBSIDIAN_PATH_PREFIX=            # empty when vault root is Project_English
 *   OBSIDIAN_LEARNER_ID=me
 *   OBSIDIAN_TRY_PREFIXES=1
 *   VAULT_ANALYZE_OUT=./vault-md-report   # writes report.md + files.json + summary.json
 *   VAULT_ANALYZE_MAX_FILES=400
 *
 * Exit: 0 ok · 1 analysis found high-severity issues · 2 skipped / unreachable
 */
const fs = require('fs');
const path = require('path');
const sync = require(path.join(__dirname, '..', 'src', 'domain', 'obsidian-sync.js'));
const analyze = require(path.join(__dirname, '..', 'src', 'domain', 'vault-md-analyze.js'));

const API_KEY = String(process.env.OBSIDIAN_API_KEY || '').trim();
const BASE_URL = String(process.env.OBSIDIAN_BASE_URL || 'http://127.0.0.1:27123').replace(/\/$/, '');
const PATH_PREFIX = String(process.env.OBSIDIAN_PATH_PREFIX || '').replace(/^\/+|\/+$/g, '');
const LEARNER_ID = String(process.env.OBSIDIAN_LEARNER_ID || 'me').trim() || 'me';
const TRY_PREFIXES = String(process.env.OBSIDIAN_TRY_PREFIXES || '1') !== '0';
const OUT_DIR = String(process.env.VAULT_ANALYZE_OUT || '').trim();
const MAX_FILES = Math.max(20, Number(process.env.VAULT_ANALYZE_MAX_FILES || 400) || 400);

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function joinVault(...parts) {
  return parts
    .filter(Boolean)
    .map((part) => String(part).replace(/^\/+|\/+$/g, ''))
    .join('/');
}

async function listRecursive(client, dir, acc = [], depth = 0) {
  if (depth > 8 || acc.length >= MAX_FILES) return acc;
  let entries = [];
  try {
    entries = await client.listDirectory(dir || '');
  } catch (error) {
    return acc;
  }
  for (const entry of entries) {
    if (acc.length >= MAX_FILES) break;
    const name = String(entry || '').replace(/^\.\//, '');
    if (!name || name === './') continue;
    const isDir = name.endsWith('/');
    const child = joinVault(dir, name.replace(/\/$/, ''));
    if (isDir) {
      await listRecursive(client, child, acc, depth + 1);
    } else if (/\.md$/i.test(child)) {
      acc.push(child);
    }
  }
  return acc;
}

async function collectFiles(client, learnerId) {
  const roots = [
    joinVault('Learners', learnerId),
    'Library',
    'MOC',
    'Reviews',
  ];
  const paths = new Set();
  for (const root of roots) {
    const listed = await listRecursive(client, root, []);
    listed.forEach((item) => paths.add(item));
  }
  // Also catch legacy unprefixed Learning/Gaps if present under prefix root
  for (const legacy of ['Learning', 'Gaps', 'English Brain Index.md']) {
    const listed = await listRecursive(client, legacy, []);
    listed.forEach((item) => paths.add(item));
  }
  const fileMap = {};
  for (const vaultPath of [...paths].sort()) {
    try {
      const markdown = await client.getFile(vaultPath);
      if (markdown != null) fileMap[vaultPath] = markdown;
    } catch (_) {
      /* skip unreadable */
    }
  }
  return fileMap;
}

async function tryPrefix(prefix) {
  const client = sync.createLocalRestClient({
    adapter: 'local-rest',
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    pathPrefix: prefix,
  });
  await client.ping();
  const contract = await sync.verifyVaultContract(client, { learnerId: LEARNER_ID, probe: false });
  const fileMap = await collectFiles(client, LEARNER_ID);
  return { prefix, contract, fileMap, client };
}

async function main() {
  if (!API_KEY) {
    log('SKIP: set OBSIDIAN_API_KEY (Mac Local REST key, no Bearer prefix).');
    log("  OBSIDIAN_API_KEY='...' node scripts/analyze_vault_md.js");
    log('Docs: docs/DAY_LOOP.md');
    process.exit(2);
  }

  const prefixes = [PATH_PREFIX];
  if (TRY_PREFIXES) {
    for (const alt of ['', 'Project_English']) {
      if (!prefixes.includes(alt)) prefixes.push(alt);
    }
  }

  let best = null;
  let lastError = null;
  for (const prefix of prefixes) {
    try {
      const report = await tryPrefix(prefix);
      const count = Object.keys(report.fileMap).length;
      log(`pathPrefix=${prefix || '(empty)'} · contract=${report.contract.ready ? 'PASS' : 'FAIL'} · md=${count}`);
      if (!best || count > Object.keys(best.fileMap).length || (report.contract.ready && !best.contract.ready)) {
        best = report;
      }
      if (report.contract.ready && count > 0) break;
    } catch (error) {
      lastError = error;
      log(`pathPrefix=${prefix || '(empty)'} · ERROR: ${error.message || error}`);
    }
  }

  if (!best) {
    log('RESULT: FAIL — Local REST에 연결하지 못했습니다.');
    if (lastError) log(String(lastError.message || lastError));
    log('Mac에서 Obsidian + Local REST(HTTP 27123)를 켠 뒤 다시 실행하세요.');
    process.exit(2);
  }

  const result = analyze.analyzeVaultFiles(best.fileMap);
  const text = analyze.formatReport(result, {
    pathPrefix: best.prefix,
    learnerId: LEARNER_ID,
  });
  process.stdout.write(`${text}\n`);

  if (OUT_DIR) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'report.md'), text, 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), `${JSON.stringify(result.summary, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, 'files.json'), `${JSON.stringify(best.fileMap, null, 2)}\n`, 'utf8');
    fs.writeFileSync(
      path.join(OUT_DIR, 'notes.json'),
      `${JSON.stringify(result.notes.map(({ attributes, ...rest }) => rest), null, 2)}\n`,
      'utf8',
    );
    log(`wrote ${OUT_DIR}/report.md (+ summary.json, files.json, notes.json)`);
  }

  const high = (result.summary.topActions || []).filter((item) => item.severity === 'high').length;
  if (!best.contract.ready) {
    log('RESULT: FAIL — folder contract 미충족. 폴더를 만든 뒤 앱 sync 후 다시 분석하세요.');
    process.exit(1);
  }
  if (high > 0) {
    log(`RESULT: NEEDS WORK — high 이슈 ${high}개`);
    process.exit(1);
  }
  log('RESULT: OK');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
