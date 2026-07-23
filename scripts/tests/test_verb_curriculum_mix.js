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
assert.strictEqual(config.verbCurriculumWeights.v_have, 0.4);
assert.strictEqual(config.verbCurriculumWeights.v_get, 0.25);
assert.strictEqual(config.verbCurriculumWeights.v_take, 0.15);

const byId = new Map(expressions.map(item => [item.id, item]));
const starterCounts = {};
config.expressionIds.forEach(id => {
  const verb = byId.get(id)?.coreVerbId;
  assert.ok(verb, `missing ${id}`);
  starterCounts[verb] = (starterCounts[verb] || 0) + 1;
});
assert.strictEqual(starterCounts.v_have, 16, 'have ~40% of 40');
assert.strictEqual(starterCounts.v_get, 10, 'get ~25% of 40');
assert.strictEqual(starterCounts.v_take, 6, 'take ~15% of 40');
assert.strictEqual(config.expressionIds.length, 40);
assert.ok(config.verbUnlockPacks.map(p => p.id).includes('verb_pack_get'));
assert.ok(config.verbUnlockPacks.map(p => p.id).includes('verb_pack_take'));
assert.ok(config.verbUnlockPacks.map(p => p.id).includes('verb_pack_keep'));
assert.ok(config.verbUnlockPacks.map(p => p.id).includes('verb_pack_find'));
assert.deepStrictEqual(config.verbIds, ['v_have']);
['e081', 'e085', 'e086', 'e087'].forEach(id => {
  assert.strictEqual(config.expressionIds.includes(id), false, `${id} should stay out of starter`);
});

console.log('✅ verb curriculum mix tests passed');
