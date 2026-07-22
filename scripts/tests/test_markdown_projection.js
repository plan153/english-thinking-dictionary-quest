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
assert.strictEqual(gap.path, `Gaps/${id}.md`);
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

const personal = api.buildExportFiles({
  brainState: {
    updatedAt: '2026-07-22T00:00:00Z',
    activeVerbIds: ['v_need'],
    activeExpressionCount: 40,
    masteredExpressionCount: 1,
    openGapIds: [id],
  },
  nextPractice: { updatedAt: '2026-07-22T00:00:00Z', queue: [] },
  progress: { updatedAt: '2026-07-22T00:00:00Z', xp: 10, streak: 1, mineCount: 1, activeExpressionCount: 40, openGapCount: 1 },
  gaps: [{ id, expressionId: 'e002', english: 'I need some time.', status: 'open', verbWord: 'need' }],
  learnerId: 'minsu',
  learnerName: '민수',
});

assert.ok(personal[`Learners/minsu/Learning/Brain State.md`]);
assert.ok(personal[`Learners/minsu/Learning/Next Practice.md`]);
assert.ok(personal[`Learners/minsu/Learning/Progress.md`]);
assert.ok(personal[`Learners/minsu/English Brain Index.md`]);
assert.ok(personal[`Learners/minsu/Gaps/${id}.md`]);
assert.ok(personal[`Learners/minsu/Learning/Brain State.md`].includes('learnerId: minsu'));
assert.ok(personal[`Learners/minsu/Learning/Brain State.md`].includes('learnerName: 민수'));
assert.ok(personal[`Learners/minsu/English Brain Index.md`].includes(`[[Learners/minsu/Gaps/${id}]]`));
assert.ok(personal[`Learners/minsu/Gaps/${id}.md`].includes('[[Verbs/need]]'));
assert.strictEqual(api.learnerVaultRoot('minsu'), 'Learners/minsu');
assert.strictEqual(api.withLearnerPath('Learning/Progress.md', 'minsu'), 'Learners/minsu/Learning/Progress.md');

console.log('✅ markdown-projection tests passed');
