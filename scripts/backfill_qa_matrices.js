#!/usr/bin/env node
'use strict';

/**
 * Backfill qa-matrices.json for ASS + unlock-pack expressions that lack matrices.
 * Uses QaMatrixGenerate for situation-fit forms.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QaMatrixGenerate = require(path.join(ROOT, 'src/domain/qa-matrix-generate.js'));

const expressions = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/expressions.json'), 'utf8'));
const verbs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/verbs.json'), 'utf8'));
const paths = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/learning-paths.json'), 'utf8'));
const qaPath = path.join(ROOT, 'data/qa-matrices.json');
const qa = JSON.parse(fs.readFileSync(qaPath, 'utf8'));

const byId = Object.fromEntries(expressions.map(item => [item.id, item]));
const ass = paths.activeSpeakingSet || {};
const ids = new Set([...(ass.expressionIds || [])]);
(ass.unlockPacks || []).forEach(pack => {
  (pack.expressionIds || []).forEach(id => ids.add(id));
});
(ass.verbUnlockPacks || []).forEach(pack => {
  (pack.expressionIds || []).forEach(id => ids.add(id));
});

const existingBases = new Set(
  (qa.matrices || [])
    .filter(matrix => !matrix.generated && !String(matrix.id || '').startsWith('m_gen_'))
    .map(matrix => matrix.baseExpressionId)
);
const existingIds = new Set(
  (qa.matrices || [])
    .filter(matrix => !matrix.generated && !String(matrix.id || '').startsWith('m_gen_'))
    .map(matrix => matrix.id)
);
qa.matrices = (qa.matrices || []).filter(
  matrix => !matrix.generated && !String(matrix.id || '').startsWith('m_gen_')
);
let added = 0;

for (const id of [...ids].sort()) {
  if (existingBases.has(id)) continue;
  const expression = byId[id];
  if (!expression) continue;
  const matrix = QaMatrixGenerate.fromExpression(expression, { verbs });
  if (!matrix) continue;
  if (existingIds.has(matrix.id)) {
    matrix.id = `${matrix.id}_${added + 1}`;
  }
  qa.matrices.push(matrix);
  existingBases.add(id);
  existingIds.add(matrix.id);
  added += 1;
  console.log(`+ ${matrix.id} ← ${id} · ${expression.english}`);
}

fs.writeFileSync(qaPath, `${JSON.stringify(qa, null, 2)}\n`, 'utf8');
console.log(`✅ added ${added} matrices (total ${qa.matrices.length})`);
