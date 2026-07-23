#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../..');
const pv = JSON.parse(fs.readFileSync(path.join(root, 'data/phrasal-verbs.json'), 'utf8'));
const expressions = JSON.parse(fs.readFileSync(path.join(root, 'data/expressions.json'), 'utf8'));
const learningPaths = JSON.parse(fs.readFileSync(path.join(root, 'data/learning-paths.json'), 'utf8'));
const api = require('../../src/domain/phrasal-speaking-set.js');
const ass = require('../../src/domain/active-speaking-set.js');

const config = api.normalizePhrasalConfig(pv);
assert.strictEqual(config.unlockPackCountRequired, 1);
assert.strictEqual(config.stages.length, 4);
assert.ok(config.groups.length >= 6);
const ids = api.listExpressionIds(config);
assert.ok(ids.includes('e081'));
assert.ok(ids.includes('e034'));
const expressionIds = new Set(expressions.map(item => item.id));
ids.forEach(id => assert.ok(expressionIds.has(id), `missing expression ${id}`));

assert.strictEqual(api.isMenuUnlocked({ unlockedPackCount: 0 }, config), false);
assert.strictEqual(api.isMenuUnlocked({ unlockedPackCount: 1 }, config), true);

// Menu open → only stage 1 (get place)
let curriculum = { unlockedPackCount: 1, unlockedPhrasalStageCount: 0 };
assert.strictEqual(api.getUnlockedStageCount(curriculum, config), 1);
assert.strictEqual(api.isGroupUnlocked(curriculum, config, 'pv_get_place'), true);
assert.strictEqual(api.isGroupUnlocked(curriculum, config, 'pv_come_particles'), false);
assert.deepStrictEqual(api.listUnlockedExpressionIds(curriculum, config), ['e081', 'e085', 'e086', 'e087']);

const blank = api.blankParticleInEnglish('I get to work.', ['to', 'home']);
assert.strictEqual(blank.matched, true);
assert.ok(blank.blanked.includes('____'));
assert.strictEqual(blank.particle.toLowerCase(), 'to');

// Clear stage 1 expressions → unlock stage 2
const progress = {
  successes: Object.fromEntries(['e081', 'e085', 'e086', 'e087'].map(id => [id, 1])),
  historyByExpressionId: Object.fromEntries(['e081', 'e085', 'e086', 'e087'].map(id => [id, {
    connections: { recognition: { strength: 0 }, assembly: { strength: 0 }, output: { strength: 0, attempts: 1 } },
  }])),
};
let synced = api.syncPhrasalStages(curriculum, config, { progress, collectAnnounce: true });
assert.strictEqual(synced.unlockedPhrasalStageCount, 2, 'stage1 clear → stage2');
assert.ok(api.isGroupUnlocked(synced.curriculum, config, 'pv_come_particles'));
assert.ok(api.isGroupUnlocked(synced.curriculum, config, 'pv_go_on'));
assert.strictEqual(api.isGroupUnlocked(synced.curriculum, config, 'pv_put_on_off'), false);
assert.ok(synced.announce.some(item => item.stageId === 'stage_come_go'));

const snap = api.getSnapshot(synced.curriculum, config, { progress });
assert.strictEqual(snap.unlocked, true);
assert.ok(snap.groups.find(g => g.id === 'pv_put_on_off').locked);
assert.ok(snap.groups.find(g => g.id === 'pv_put_on_off').lockReason.includes('이전 단계'));

// ASS bank must not auto-include exclusive phrasal IDs
const assConfig = ass.normalizeAssConfig(learningPaths.activeSpeakingSet);
const assStarter = new Set(ass.listUnlockedExpressionIds(assConfig, { unlockedPackCount: 0 }, { includeVerbPacks: false }));
['e081', 'e085', 'e086', 'e087'].forEach(id => {
  assert.strictEqual(assStarter.has(id), false, `${id} must stay out of ASS starter bank`);
});

console.log('✅ phrasal-speaking-set sequential + particle blank tests passed');
