#!/usr/bin/env node
/**
 * Push vault/Project_English seed Markdown into a real Obsidian vault via Local REST.
 *
 * Usage (Mac, Obsidian + Local REST on):
 *   OBSIDIAN_API_KEY='...' node scripts/seed_vault_english_brain.js
 *
 * Env:
 *   OBSIDIAN_BASE_URL=http://127.0.0.1:27123
 *   OBSIDIAN_PATH_PREFIX=Project_English
 *   SEED_MODE=skip-existing | overwrite   (default skip-existing)
 *   SEED_DIR=vault/Project_English
 */
const fs = require('fs');
const path = require('path');
const sync = require(path.join(__dirname, '..', 'src', 'domain', 'obsidian-sync.js'));

const API_KEY = String(process.env.OBSIDIAN_API_KEY || '').trim();
const BASE_URL = String(process.env.OBSIDIAN_BASE_URL || 'http://127.0.0.1:27123').replace(/\/$/, '');
const PATH_PREFIX = String(process.env.OBSIDIAN_PATH_PREFIX || 'Project_English').replace(/^\/+|\/+$/g, '');
const SEED_MODE = String(process.env.SEED_MODE || 'skip-existing').trim();
const SEED_DIR = path.resolve(
  process.env.SEED_DIR || path.join(__dirname, '..', 'vault', 'Project_English'),
);

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function walkMd(dir, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkMd(full, base, acc);
    else if (ent.name.endsWith('.md')) {
      acc.push({
        abs: full,
        rel: path.relative(base, full).split(path.sep).join('/'),
      });
    }
  }
  return acc;
}

async function main() {
  if (!API_KEY) {
    log('SKIP: set OBSIDIAN_API_KEY');
    log("  OBSIDIAN_API_KEY='...' OBSIDIAN_PATH_PREFIX=Project_English node scripts/seed_vault_english_brain.js");
    process.exit(2);
  }
  if (!fs.existsSync(SEED_DIR)) {
    log(`Seed missing at ${SEED_DIR}`);
    log('Run: node scripts/build_vault_english_brain_seed.js');
    process.exit(1);
  }

  const client = sync.createLocalRestClient({
    adapter: 'local-rest',
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    pathPrefix: PATH_PREFIX,
  });
  await client.ping();

  const files = walkMd(SEED_DIR);
  let written = 0;
  let skipped = 0;
  for (const file of files) {
    const existing = await client.getFile(file.rel);
    if (existing != null && SEED_MODE !== 'overwrite') {
      skipped += 1;
      continue;
    }
    const markdown = fs.readFileSync(file.abs, 'utf8');
    await client.putFile(file.rel, markdown);
    written += 1;
    log(`PUT ${file.rel}`);
  }

  // Ensure empty contract folders exist with keep notes if missing
  const keeps = [
    'Library/Drafts/_keep.md',
    'Library/Canon/_keep.md',
    'Learners/me/Gaps/_keep.md',
    'Learners/me/Learning/_keep.md',
  ];
  for (const keep of keeps) {
    const existing = await client.getFile(keep);
    if (existing != null) continue;
    await client.putFile(keep, `---\ntype: keep\nsource: vault-seed\n---\n\n# keep\n\n폴더 유지용.\n`);
    written += 1;
    log(`PUT ${keep}`);
  }

  log(`\nRESULT: written=${written} skipped=${skipped} mode=${SEED_MODE} prefix=${PATH_PREFIX || '(empty)'}`);
  log('Next: node scripts/analyze_vault_md.js');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
