#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../..');
const pv = JSON.parse(fs.readFileSync(path.join(root, 'data/phrasal-verbs.json'), 'utf8'));
const expressions = JSON.parse(fs.readFileSync(path.join(root, 'data/expressions.json'), 'utf8'));
const api = require('../../src/domain/phrasal-speaking-set.js');

const config = api.normalizePhrasalConfig(pv);
assert.strictEqual(config.unlockPackCountRequired, 1);
assert.ok(config.groups.length >= 6);
const ids = api.listExpressionIds(config);
assert.ok(ids.includes('e081'));
assert.ok(ids.includes('e034'));
const expressionIds = new Set(expressions.map(item => item.id));
ids.forEach(id => assert.ok(expressionIds.has(id), `missing expression ${id}`));

assert.strictEqual(api.isMenuUnlocked({ unlockedPackCount: 0 }, config), false);
assert.strictEqual(api.isMenuUnlocked({ unlockedPackCount: 1 }, config), true);
assert.strictEqual(api.isMenuUnlocked({ unlockedPackCount: 3 }, config), true);

const snapLocked = api.getSnapshot({ unlockedPackCount: 0 }, config);
assert.strictEqual(snapLocked.unlocked, false);
assert.ok(snapLocked.groups.every(g => g.locked));

const snapOpen = api.getSnapshot({ unlockedPackCount: 1 }, config);
assert.strictEqual(snapOpen.unlocked, true);
assert.strictEqual(snapOpen.expressionCount, ids.length);
assert.deepStrictEqual(
  api.listGroupExpressionIds(config, 'pv_get_place'),
  ['e081', 'e085', 'e086', 'e087']
);

console.log('✅ phrasal-speaking-set tests passed');
