#!/usr/bin/env node
/**
 * P2a: merge a Canon intake bundle into data/expressions.json (repo SoT).
 *
 *   node scripts/merge_canon_intake.js path/to/canon-intake.json
 *   node scripts/merge_canon_intake.js path/to/canon-intake.json --dry-run
 */
const fs = require('fs');
const path = require('path');
const canon = require('../src/domain/canon-intake.js');

const root = path.join(__dirname, '..');
const expressionsPath = path.join(root, 'data', 'expressions.json');
const args = process.argv.slice(2).filter(arg => arg !== '--dry-run');
const dryRun = process.argv.includes('--dry-run');
const intakePath = args[0];

if (!intakePath) {
  console.error('Usage: node scripts/merge_canon_intake.js <canon-intake.json> [--dry-run]');
  process.exit(2);
}

const abs = path.resolve(intakePath);
if (!fs.existsSync(abs)) {
  console.error(`Missing file: ${abs}`);
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(abs, 'utf8'));
const candidates = Array.isArray(bundle.expressionsToAdd)
  ? bundle.expressionsToAdd
  : (bundle.candidates || []);
const existing = JSON.parse(fs.readFileSync(expressionsPath, 'utf8'));
const result = canon.mergeCandidatesIntoExpressions(existing, candidates, { overwrite: false });

console.log(`added=${result.added.length} updated=${result.updated.length}`);
if (result.added.length) console.log(`new ids: ${result.added.join(', ')}`);
if (dryRun) {
  console.log('dry-run: expressions.json not written');
  process.exit(0);
}
fs.writeFileSync(expressionsPath, `${JSON.stringify(result.expressions, null, 2)}\n`, 'utf8');
console.log(`wrote ${expressionsPath}`);
