#!/usr/bin/env node
/**
 * Smoke: Unlock packs + sequential verb gate + Next Practice queue wiring.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../..');
const learningPaths = JSON.parse(fs.readFileSync(path.join(root, 'data/learning-paths.json'), 'utf8'));
const qaMatrices = JSON.parse(fs.readFileSync(path.join(root, 'data/qa-matrices.json'), 'utf8'));
const expressions = JSON.parse(fs.readFileSync(path.join(root, 'data/expressions.json'), 'utf8'));
const ass = require('../../src/domain/active-speaking-set.js');
const gate = require('../../src/domain/verb-matrix-gate.js');
const next = require('../../src/domain/next-practice.js');

const config = ass.normalizeAssConfig(learningPaths.activeSpeakingSet);
assert.strictEqual(config.unlockPacks.length, 3);
assert.deepStrictEqual(config.unlockPacks.map(p => p.id), ['pack_1', 'pack_2', 'pack_3']);
assert.strictEqual(config.unlockPacks[2].expressionIds.length, 9);
assert.deepStrictEqual(
  config.verbUnlockPacks.map(p => p.id),
  ['verb_pack_give', 'verb_pack_be', 'verb_pack_do', 'verb_pack_put']
);

const expressionIds = new Set(expressions.map(item => item.id));
[...config.expressionIds, ...config.unlockPacks.flatMap(p => p.expressionIds), ...config.verbUnlockPacks.flatMap(p => p.expressionIds)]
  .forEach(id => assert.ok(expressionIds.has(id), `missing expression ${id}`));

const starter = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 0 }, { includeVerbPacks: false });
assert.strictEqual(starter.length, 40);
const withPack1 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 1 }, { includeVerbPacks: false });
assert.strictEqual(withPack1.length, 50);
const withPack2 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 2 }, { includeVerbPacks: false });
assert.strictEqual(withPack2.length, 59);
const withPack3 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 3 }, { includeVerbPacks: false });
assert.strictEqual(withPack3.length, 68);
assert.ok(withPack3.includes('e011'));
assert.ok(withPack3.includes('e067'));

const matrices = qaMatrices.matrices || [];
for (const id of ['m_give_a_second', 'm_be_ready', 'm_do_it_now', 'm_put_it_here']) {
  assert.ok(matrices.some(m => m.id === id), `missing matrix ${id}`);
}

function passVerb(curriculum, verbId) {
  let nextCur = curriculum;
  ['statement', 'question', 'negative', 'shortYes'].forEach(formId => {
    nextCur = gate.recordMatrixFormSuccess(nextCur, verbId, formId).curriculum;
  });
  return nextCur;
}

let curriculum = gate.ensureMatrixFormSuccess({});
config.verbIds.forEach(verbId => {
  if (matrices.some(m => m.coreVerbId === verbId)) curriculum = passVerb(curriculum, verbId);
});
let synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 1, 'starter → give');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_give']);

curriculum = passVerb(synced.curriculum, 'v_give');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 2, 'give → be');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_be']);

curriculum = passVerb(synced.curriculum, 'v_be');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 3, 'be → do');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_do']);
assert.ok(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e017'));

curriculum = passVerb(synced.curriculum, 'v_do');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 4, 'do → put');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_put']);
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_put'));
assert.ok(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e010'));

const unlockedBank = withPack3.map(id => {
  const row = expressions.find(item => item.id === id);
  return { id, coreVerbId: row.coreVerbId, nounIds: row.nounIds || [], en: row.english, english: row.english };
});
const queue = next.buildQueue({
  importedNextPractice: {
    source: 'vault',
    queue: [
      { expressionId: 'e011', mode: 'listen', reason: 'vault-next-practice' },
      { expressionId: 'e999', mode: 'review', reason: 'missing' },
    ],
  },
  unlockedIds: withPack3,
  unlockedBank,
  openGaps: [{ expressionId: 'e001', mode: 'review' }],
});
assert.strictEqual(queue.length, 1);
assert.strictEqual(queue[0].expressionId, 'e011');

console.log('✅ unlock packs + verb do/put + Next Practice smoke passed');
