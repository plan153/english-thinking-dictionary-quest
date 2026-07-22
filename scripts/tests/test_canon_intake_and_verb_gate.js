#!/usr/bin/env node
const assert = require('assert');
const intake = require('../../src/domain/canon-intake.js');
const gate = require('../../src/domain/verb-matrix-gate.js');

assert.strictEqual(intake.nextExpressionId(['e001', 'e090']), 'e091');
assert.strictEqual(intake.nextExpressionId([]), 'e001');

const candidate = intake.draftToExpressionCandidate({
  id: 'draft_1',
  english: 'Give it a shot.',
  naturalKorean: '한번 시도해 봐요.',
  literalMeaning: '',
  coreVerb: 'give',
  pattern: 'give + it + a shot',
  status: 'approved',
}, {
  existingExpressionIds: ['e001', 'e090'],
  verbs: [{ id: 'v_give', word: 'give' }],
});
assert.strictEqual(candidate.id, 'e091');
assert.strictEqual(candidate.coreVerbId, 'v_give');
assert.strictEqual(candidate.naturalKorean, '한번 시도해 봐요.');
assert.ok(candidate._intake.reviewStatus === 'pending');

const bundle = intake.buildCanonIntakeBundle({
  drafts: [{
    id: 'draft_1',
    status: 'approved',
    english: 'Give it a shot.',
    naturalKorean: '한번 시도해 봐요.',
    coreVerb: 'give',
    pattern: 'give + it',
  }, {
    id: 'draft_2',
    status: 'draft',
    english: 'skip me',
    naturalKorean: '건너뛰기',
    coreVerb: 'get',
    pattern: 'get + it',
  }],
  existingExpressionIds: ['e090'],
  verbs: [{ id: 'v_give', word: 'give' }],
});
assert.strictEqual(bundle.expressionsToAdd.length, 1);
assert.ok(!bundle.expressionsToAdd[0]._intake);
assert.strictEqual(bundle.suggestedUnlockPack.expressionIds.length, 1);

assert.strictEqual(gate.normalizeFormKey('shortYes'), 'shortAnswer');
assert.strictEqual(gate.normalizeFormKey('past'), '');

let curriculum = gate.ensureMatrixFormSuccess({});
['statement', 'question', 'negative', 'shortYes'].forEach(formId => {
  curriculum = gate.recordMatrixFormSuccess(curriculum, 'v_have', formId).curriculum;
});
assert.strictEqual(gate.isVerbMatrixGatePassed(curriculum, 'v_have'), true);
assert.strictEqual(gate.isVerbMatrixGatePassed(curriculum, 'v_get'), false);

const matrices = [
  { id: 'm1', coreVerbId: 'v_have' },
  { id: 'm2', coreVerbId: 'v_get' },
];
const config = {
  verbIds: ['v_have', 'v_get'],
  verbUnlockPacks: [{
    id: 'verb_pack_give',
    verbIds: ['v_give'],
    expressionIds: ['e007', 'e040'],
  }],
};
let snap = gate.getVerbGateSnapshot(curriculum, config.verbIds, matrices);
assert.strictEqual(snap.passedCount, 1);
assert.strictEqual(snap.allPassed, false);

['statement', 'question', 'negative', 'shortNo'].forEach(formId => {
  curriculum = gate.recordMatrixFormSuccess(curriculum, 'v_get', formId).curriculum;
});
const synced = gate.syncVerbUnlock(curriculum, config, matrices, { collectAnnounce: true });
assert.strictEqual(synced.changed, true);
assert.strictEqual(synced.unlockedVerbPackCount, 1);
assert.deepStrictEqual(gate.getUnlockedVerbIds(config, synced.curriculum), ['v_have', 'v_get', 'v_give']);
assert.deepStrictEqual(gate.getUnlockedVerbExpressionIds(config, synced.curriculum), ['e007', 'e040']);

console.log('✅ canon-intake + verb-matrix-gate tests passed');
