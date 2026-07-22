#!/usr/bin/env node
/**
 * Curriculum levels / spiral / level-test config smoke.
 */
const assert = require('assert');
const paths = require('../../data/learning-paths.json');

const ass = paths.activeSpeakingSet;
assert.ok(Array.isArray(ass.curriculumLevels) && ass.curriculumLevels.length >= 2);
assert.strictEqual(ass.curriculumLevels[0].id, 'L1');
assert.strictEqual(ass.curriculumLevels[1].id, 'L2');
assert.ok(ass.curriculumLevels[0].includesLowerLevels);
assert.ok(ass.curriculumLevels[1].includesLowerLevels);
assert.ok(Number(ass.spiralLowerRatio) > 0);
assert.deepStrictEqual(
  ass.curriculumLevels[0].levelTest.matrixForms,
  ['statement', 'question', 'negative']
);
assert.ok(paths.dailyLoop.quizOrder.includes('matrix-mini'));
assert.deepStrictEqual(paths.dailyLoop.matrixMiniForms, ['statement', 'question', 'negative']);
assert.strictEqual(ass.expressionIds.length, 40);
assert.strictEqual(ass.unlockPacks[0].expressionIds.length, 10);

console.log('✅ curriculum level config tests passed');
