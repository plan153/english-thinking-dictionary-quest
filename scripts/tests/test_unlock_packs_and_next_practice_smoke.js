#!/usr/bin/env node
/**
 * Smoke: Unlock packs + sequential verb gate (have→get→take) + Next Practice queue wiring.
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
assert.deepStrictEqual(config.verbIds, ['v_have']);
assert.deepStrictEqual(
  config.verbUnlockPacks.map(p => p.id),
  [
    'verb_pack_get',
    'verb_pack_take',
    'verb_pack_core_rest',
    'verb_pack_give',
    'verb_pack_be',
    'verb_pack_do',
    'verb_pack_put',
    'verb_pack_keep',
    'verb_pack_find',
  ]
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
for (const id of ['m_give_a_second', 'm_be_ready', 'm_do_it_now', 'm_put_it_here', 'm_keep_going', 'm_find_it']) {
  assert.ok(matrices.some(m => m.id === id), `missing matrix ${id}`);
}

function passVerb(curriculum, verbId) {
  let nextCur = curriculum;
  ['statement', 'question', 'negative', 'shortYes'].forEach(formId => {
    nextCur = gate.recordMatrixFormSuccess(nextCur, verbId, formId).curriculum;
  });
  return nextCur;
}

// Fresh learner: only have is unlocked until 4-form passes.
let curriculum = gate.ensureMatrixFormSuccess({});
assert.strictEqual(curriculum.verbGateSchemaVersion, 2);
assert.deepStrictEqual(gate.getUnlockedVerbIds(config, curriculum), ['v_have']);
let synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 0, 'have not passed yet');

curriculum = passVerb(curriculum, 'v_have');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 1, 'have → get');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_get']);
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_get'));

curriculum = passVerb(synced.curriculum, 'v_get');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 2, 'get → take');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_take']);

curriculum = passVerb(synced.curriculum, 'v_take');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 3, 'take → core_rest');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_core_rest']);
['v_want', 'v_need', 'v_go', 'v_come', 'v_make'].forEach(id => {
  assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes(id), id);
});

['v_want', 'v_need', 'v_go', 'v_come', 'v_make'].forEach(verbId => {
  if (matrices.some(m => m.coreVerbId === verbId)) {
    synced = { curriculum: passVerb(synced.curriculum, verbId) };
  }
});
synced = gate.syncVerbUnlock(synced.curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 4, 'core_rest → give');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_give']);

curriculum = passVerb(synced.curriculum, 'v_give');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 5, 'give → be');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_be']);

curriculum = passVerb(synced.curriculum, 'v_be');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 6, 'be → do');
assert.ok(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e017'));

curriculum = passVerb(synced.curriculum, 'v_do');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 7, 'do → put');
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_put'));

curriculum = passVerb(synced.curriculum, 'v_put');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 8, 'put → keep');
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_keep'));
assert.strictEqual(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e057'), false, 'find still locked');

curriculum = passVerb(synced.curriculum, 'v_keep');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 9, 'keep → find');
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_find'));
assert.ok(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e057'));

// Legacy migration: old unlockedVerbPackCount=1 (give) → +3 prepend offset
const legacy = gate.ensureMatrixFormSuccess({
  unlockedVerbPackCount: 1,
  lastVerbUnlockAt: '2026-01-01T00:00:00.000Z',
  matrixFormSuccess: { v_have: { statement: 1, question: 1, negative: 1, shortAnswer: 1 } },
});
assert.strictEqual(legacy.verbGateSchemaVersion, 2);
assert.strictEqual(legacy.unlockedVerbPackCount, 4, 'legacy give unlock maps past get/take/core_rest');

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

console.log('✅ unlock packs + have/get/take gate + Next Practice smoke passed');
