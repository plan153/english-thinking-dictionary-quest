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
assert.strictEqual(config.unlockPacks.length, 2);
assert.strictEqual(config.unlockPacks[1].id, 'pack_2');
assert.strictEqual(config.unlockPacks[1].expressionIds.length, 9);
assert.strictEqual(config.verbUnlockPacks.length, 2);
assert.strictEqual(config.verbUnlockPacks[1].id, 'verb_pack_be');

const expressionIds = new Set(expressions.map(item => item.id));
[...config.expressionIds, ...config.unlockPacks.flatMap(p => p.expressionIds), ...config.verbUnlockPacks.flatMap(p => p.expressionIds)]
  .forEach(id => assert.ok(expressionIds.has(id), `missing expression ${id}`));

const starter = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 0 }, { includeVerbPacks: false });
assert.strictEqual(starter.length, 40);
const withPack1 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 1 }, { includeVerbPacks: false });
assert.strictEqual(withPack1.length, 50);
assert.ok(withPack1.includes('e023'));
const withPack2 = ass.listUnlockedExpressionIds(config, { unlockedPackCount: 2 }, { includeVerbPacks: false });
assert.strictEqual(withPack2.length, 59);
assert.ok(withPack2.includes('e065'));
assert.ok(withPack2.includes('e087'));

const matrices = qaMatrices.matrices || [];
assert.ok(matrices.some(m => m.id === 'm_give_a_second' && m.coreVerbId === 'v_give'));
assert.ok(matrices.some(m => m.id === 'm_be_ready' && m.coreVerbId === 'v_be'));

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
const afterStarter = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(afterStarter.unlockedVerbPackCount, 1, 'starter pass unlocks only give');
assert.deepStrictEqual(afterStarter.announce.map(a => a.packId), ['verb_pack_give']);
assert.ok(gate.getUnlockedVerbExpressionIds(config, afterStarter.curriculum).includes('e007'));
assert.ok(!gate.getUnlockedVerbExpressionIds(config, afterStarter.curriculum).includes('e016'));

curriculum = passVerb(afterStarter.curriculum, 'v_give');
const afterGive = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(afterGive.unlockedVerbPackCount, 2, 'give matrices unlock be');
assert.deepStrictEqual(afterGive.announce.map(a => a.packId), ['verb_pack_be']);
assert.ok(gate.getUnlockedVerbIds(config, afterGive.curriculum).includes('v_be'));
assert.ok(gate.getUnlockedVerbExpressionIds(config, afterGive.curriculum).includes('e016'));

const unlockedBank = withPack2.map(id => {
  const row = expressions.find(item => item.id === id);
  return { id, coreVerbId: row.coreVerbId, nounIds: row.nounIds || [], en: row.english, english: row.english };
});
const queue = next.buildQueue({
  importedNextPractice: {
    source: 'vault',
    queue: [
      { expressionId: 'e065', mode: 'koen', reason: 'vault-next-practice' },
      { expressionId: 'e999', mode: 'review', reason: 'missing' },
    ],
  },
  unlockedIds: withPack2,
  unlockedBank,
  openGaps: [{ expressionId: 'e001', mode: 'review' }],
});
assert.strictEqual(queue.length, 1);
assert.strictEqual(queue[0].expressionId, 'e065');
assert.strictEqual(queue[0].mode, 'koen');

const localQueue = next.buildQueue({
  openGaps: [{ expressionId: 'e073', mode: 'matrix' }],
  watchlistLinks: [{ status: 'watchlist', entityType: 'expression', entityId: 'e088' }],
  importedBrainState: { weakSlots: [{ expressionId: 'e081', reason: 'weak-link' }] },
  weakReview: [{ expressionId: 'e089', reason: 'weak-link' }],
  unlockedIds: withPack2,
  unlockedBank,
});
assert.deepStrictEqual(localQueue.map(item => item.expressionId), ['e073', 'e088', 'e081', 'e089']);

console.log('✅ unlock packs + verb be + Next Practice smoke passed');
