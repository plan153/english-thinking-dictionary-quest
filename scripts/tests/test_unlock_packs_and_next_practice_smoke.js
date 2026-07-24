#!/usr/bin/env node
/**
 * Smoke: Unlock packs + sequential verb gate (starter → go/come/make…) + Next Practice queue wiring.
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
assert.deepStrictEqual(config.verbIds, [
  'v_have', 'v_get', 'v_take', 'v_want', 'v_need', 'v_be', 'v_do', 'v_feel',
]);
assert.deepStrictEqual(
  config.verbUnlockPacks.map(p => p.id),
  [
    'verb_pack_go_come_make',
    'verb_pack_give',
    'verb_pack_put',
    'verb_pack_keep',
    'verb_pack_find',
  ]
);

const expressionIds = new Set(expressions.map(item => item.id));
[...config.expressionIds, ...config.unlockPacks.flatMap(p => p.expressionIds), ...config.verbUnlockPacks.flatMap(p => p.expressionIds)]
  .forEach(id => assert.ok(expressionIds.has(id), `missing expression ${id}`));

const starter = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 0 }, { includeVerbPacks: false });
assert.strictEqual(starter.length, 106);
assert.ok(starter.includes('e137'), 'It is what it is in starter');
assert.ok(starter.includes('e016'), 'be ready in starter');
assert.ok(starter.includes('e013'), 'feel expression in starter');
const withPack1 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 1 }, { includeVerbPacks: false });
assert.strictEqual(withPack1.length, 116);
const withPack2 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 2 }, { includeVerbPacks: false });
assert.strictEqual(withPack2.length, 125);
const withPack3 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 3 }, { includeVerbPacks: false });
assert.strictEqual(withPack3.length, 130);
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

// Fresh learner: starter verbs unlocked; next pack waits for all starter matrices.
let curriculum = gate.ensureMatrixFormSuccess({});
assert.strictEqual(curriculum.verbGateSchemaVersion, 3);
assert.deepStrictEqual(gate.getUnlockedVerbIds(config, curriculum), config.verbIds);
let synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 0, 'starter matrices not passed yet');

config.verbIds.forEach(verbId => {
  if (matrices.some(m => m.coreVerbId === verbId)) {
    curriculum = passVerb(curriculum, verbId);
  }
});
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 1, 'starter → go/come/make');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_go_come_make']);
['v_go', 'v_come', 'v_make'].forEach(id => {
  assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes(id), id);
});

['v_go', 'v_come', 'v_make'].forEach(verbId => {
  if (matrices.some(m => m.coreVerbId === verbId)) {
    synced = { curriculum: passVerb(synced.curriculum, verbId) };
  }
});
synced = gate.syncVerbUnlock(synced.curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 2, 'go/come/make → give');
assert.deepStrictEqual(synced.announce.map(a => a.packId), ['verb_pack_give']);

curriculum = passVerb(synced.curriculum, 'v_give');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 3, 'give → put');
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_put'));

curriculum = passVerb(synced.curriculum, 'v_put');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 4, 'put → keep');
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_keep'));
assert.strictEqual(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e057'), false, 'find still locked');

curriculum = passVerb(synced.curriculum, 'v_keep');
synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.unlockedVerbPackCount, 5, 'keep → find');
assert.ok(gate.getUnlockedVerbIds(config, synced.curriculum).includes('v_find'));
assert.ok(gate.getUnlockedVerbExpressionIds(config, synced.curriculum).includes('e057'));

// Legacy migration: v1 count=1 (give-era) → v2 +3 → v3 map
const legacy = gate.ensureMatrixFormSuccess({
  unlockedVerbPackCount: 1,
  lastVerbUnlockAt: '2026-01-01T00:00:00.000Z',
  matrixFormSuccess: { v_have: { statement: 1, question: 1, negative: 1, shortAnswer: 1 } },
});
assert.strictEqual(legacy.verbGateSchemaVersion, 3);
assert.strictEqual(legacy.unlockedVerbPackCount, 2, 'legacy give unlock maps to give pack index in v3');

// v2→v3 mapping smoke
assert.strictEqual(gate.mapV2VerbPackCountToV3(0), 0);
assert.strictEqual(gate.mapV2VerbPackCountToV3(3), 1);
assert.strictEqual(gate.mapV2VerbPackCountToV3(5), 2);
assert.strictEqual(gate.mapV2VerbPackCountToV3(9), 5);

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

console.log('✅ unlock packs + starter verb gate + Next Practice smoke passed');
