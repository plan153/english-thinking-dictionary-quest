#!/usr/bin/env node
const assert = require('assert');
const api = require('../../src/domain/markdown-projection.js');

const id = api.makeGapId({ expressionId: 'e002', guess: 'I need time', mode: 'koen', createdAt: '2026-07-22T00:00:00Z' });
assert.ok(id.startsWith('gap_e002_20260722_'));
assert.strictEqual(
  api.makeGapId({ expressionId: 'e002', guess: 'I need time', mode: 'koen', createdAt: '2026-07-22T00:00:00Z' }),
  id
);

const gap = api.projectGapNote({
  id,
  expressionId: 'e002',
  english: 'I need some time.',
  naturalKorean: '시간이 좀 필요해요.',
  guess: 'I need time',
  actual: 'I need some time.',
  missedClue: 'some',
  modelUpdate: 'need + some time',
  verbWord: 'need',
  mode: 'koen',
  status: 'open',
  createdAt: '2026-07-22T00:00:00Z',
  updatedAt: '2026-07-22T00:00:00Z',
});
assert.strictEqual(gap.path, `Gaps/${id}.md`); // no learnerId
assert.ok(gap.markdown.includes('type: gap-note'));
assert.ok(gap.markdown.includes('## 내 추측'));
assert.ok(gap.markdown.includes('[[Verbs/need]]'));

const files = api.buildExportFiles({
  brainState: {
    updatedAt: '2026-07-22T00:00:00Z',
    activeVerbIds: ['v_need'],
    activeVerbWords: ['need'],
    activeExpressionCount: 40,
    masteredExpressionCount: 3,
    weakSlots: [{ expressionId: 'e002', reason: 'output-low' }],
    openGapIds: [id],
    unlockReady: false,
  },
  nextPractice: {
    updatedAt: '2026-07-22T00:00:00Z',
    queue: [{ expressionId: 'e002', mode: 'matrix', reason: 'open-gap' }],
  },
  progress: {
    updatedAt: '2026-07-22T00:00:00Z',
    xp: 30,
    streak: 1,
    unlockedPackCount: 0,
    mineCount: 3,
    activeExpressionCount: 40,
    openGapCount: 1,
  },
  gaps: [{
    id,
    expressionId: 'e002',
    english: 'I need some time.',
    naturalKorean: '시간이 좀 필요해요.',
    guess: 'I need time',
    actual: 'I need some time.',
    status: 'open',
    createdAt: '2026-07-22T00:00:00Z',
    updatedAt: '2026-07-22T00:00:00Z',
    verbWord: 'need',
    mode: 'koen',
  }],
});

assert.ok(files['Learning/Brain State.md']);
assert.ok(files['Learning/Next Practice.md']);
assert.ok(files['Learning/Progress.md']);
assert.ok(files['English Brain Index.md']);
assert.ok(files[`Gaps/${id}.md`]);

const learnerFiles = api.buildExportFiles({
  brainState: {
    updatedAt: '2026-07-22T00:00:00Z',
    activeVerbIds: ['v_need'],
    activeExpressionCount: 40,
    masteredExpressionCount: 3,
    weakSlots: [],
    openGapIds: [id],
    unlockReady: false,
  },
  nextPractice: { updatedAt: '2026-07-22T00:00:00Z', queue: [] },
  progress: { updatedAt: '2026-07-22T00:00:00Z', xp: 0, streak: 0, unlockedPackCount: 0, mineCount: 0, activeExpressionCount: 40, openGapCount: 1 },
  gaps: [{ id, expressionId: 'e002', english: 'I need some time.', status: 'open', createdAt: '2026-07-22T00:00:00Z', updatedAt: '2026-07-22T00:00:00Z' }],
  drafts: [],
  learnerId: 'me',
  learnerName: '나',
});
assert.ok(learnerFiles['Learners/me/Learning/Brain State.md']);
assert.ok(learnerFiles['Learners/me/Learning/Next Practice.md']);
assert.ok(learnerFiles[`Learners/me/Gaps/${id}.md`]);
assert.ok(learnerFiles['Library/Index.md']); // shared
assert.strictEqual(api.learnerVaultRoot('me'), 'Learners/me');
assert.strictEqual(api.withLearnerPath('Gaps/x.md', 'me'), 'Learners/me/Gaps/x.md');


const draftEval = api.evaluatePromoteChecklist({
  english: 'I need some time.',
  naturalKorean: '시간이 좀 필요해요.',
  coreVerb: 'need',
  pattern: 'need + noun',
  literalMeaning: '',
});
assert.strictEqual(draftEval.ready, true);

const weakDraft = api.projectExpressionDraft({
  id: 'draft_test_1',
  english: 'I need some time.',
  naturalKorean: '',
  coreVerb: 'need',
  pattern: '',
  status: 'draft',
  source: 'gap',
  sourceGapId: id,
});
assert.strictEqual(weakDraft.path, 'Library/Drafts/draft_test_1.md');
assert.strictEqual(weakDraft.promoteReady, false);

const readyDraft = api.projectExpressionDraft({
  id: 'draft_test_2',
  english: 'I need some time.',
  naturalKorean: '시간이 좀 필요해요.',
  coreVerb: 'need',
  pattern: 'need + noun',
  literalMeaning: '',
  status: 'approved',
  source: 'gap',
});
assert.strictEqual(readyDraft.path, 'Library/Canon/draft_test_2.md');
assert.strictEqual(readyDraft.promoteReady, true);
assert.ok(readyDraft.markdown.includes('promoteReady: true'));

const withLibrary = api.buildExportFiles({
  brainState: { updatedAt: '2026-07-22T00:00:00Z', activeExpressionCount: 40, masteredExpressionCount: 1, openGapIds: [] },
  nextPractice: { updatedAt: '2026-07-22T00:00:00Z', queue: [] },
  progress: { updatedAt: '2026-07-22T00:00:00Z', xp: 0, streak: 0, mineCount: 1, activeExpressionCount: 40, openGapCount: 0 },
  gaps: [],
  drafts: [{
    id: 'draft_test_2',
    english: 'I need some time.',
    naturalKorean: '시간이 좀 필요해요.',
    coreVerb: 'need',
    pattern: 'need + noun',
    status: 'approved',
  }],
});
assert.ok(withLibrary['Library/Index.md']);
assert.ok(withLibrary['Library/Canon/draft_test_2.md']);
assert.ok(withLibrary['English Brain Index.md'].includes('Library/Index'));

const explanationNote = {
  id: 'exp_e002_20260722_abc',
  expressionId: 'e002',
  english: 'I need some time.',
  naturalKorean: '시간이 좀 필요해요.',
  explanation: 'I need time.',
  status: 'passed',
  allowedRatio: 1,
  blockedWords: [],
  verbWord: 'need',
  createdAt: '2026-07-22T00:00:00Z',
};
const explanation = api.projectExplanation(explanationNote);
assert.strictEqual(explanation.path, 'Learning/Explanations/exp_e002_20260722_abc.md');
assert.ok(explanation.markdown.includes('type: explanation'));

const withExplain = api.buildExportFiles({
  brainState: { updatedAt: '2026-07-22T00:00:00Z', activeExpressionCount: 1, masteredExpressionCount: 0, openGapIds: [] },
  nextPractice: { updatedAt: '2026-07-22T00:00:00Z', queue: [] },
  progress: { updatedAt: '2026-07-22T00:00:00Z', xp: 0, streak: 0, mineCount: 0, activeExpressionCount: 1, openGapCount: 0 },
  gaps: [],
  explanations: [explanationNote],
  learnerId: 'me',
  learnerName: '나',
});
assert.ok(withExplain['Learners/me/Learning/Explanations/exp_e002_20260722_abc.md']);

console.log('✅ markdown-projection tests passed');
