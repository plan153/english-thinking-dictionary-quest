#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../..');
const learningPaths = JSON.parse(fs.readFileSync(path.join(root, 'data/learning-paths.json'), 'utf8'));
const expressions = JSON.parse(fs.readFileSync(path.join(root, 'data/expressions.json'), 'utf8'));
const ass = require('../../src/domain/active-speaking-set.js');

const config = ass.normalizeAssConfig(learningPaths.activeSpeakingSet);
assert.ok(config.verbCurriculumWeights);
assert.strictEqual(config.verbCurriculumWeights.v_have, 0.28);
assert.strictEqual(config.verbCurriculumWeights.v_get, 0.18);
assert.strictEqual(config.verbCurriculumWeights.v_take, 0.12);
assert.strictEqual(config.verbCurriculumWeights.v_be, 0.12);

assert.deepStrictEqual(config.verbIds, [
  'v_have', 'v_get', 'v_take', 'v_want', 'v_need', 'v_be', 'v_do', 'v_feel',
]);

const byId = new Map(expressions.map(item => [item.id, item]));
const starterCounts = {};
config.expressionIds.forEach(id => {
  const verb = byId.get(id)?.coreVerbId;
  assert.ok(verb, `missing ${id}`);
  starterCounts[verb] = (starterCounts[verb] || 0) + 1;
});
assert.ok(starterCounts.v_have >= 16, 'have still a major starter share');
assert.ok(starterCounts.v_get >= 10, 'get starter share');
assert.ok(starterCounts.v_be >= 50, 'be pack joined starter');
assert.ok(config.expressionIds.length >= 100);
assert.ok(config.expressionIds.includes('e081'), 'get-place starter IDs included');
assert.ok(config.expressionIds.includes('e085'));

const packIds = config.verbUnlockPacks.map(p => p.id);
assert.ok(packIds.includes('verb_pack_go_come_make'));
assert.ok(packIds.includes('verb_pack_give'));
assert.ok(packIds.includes('verb_pack_keep'));
assert.ok(packIds.includes('verb_pack_find'));

console.log('✅ verb curriculum mix tests passed');
