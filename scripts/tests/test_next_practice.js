#!/usr/bin/env node
const assert = require('assert');
const next = require('../../src/domain/next-practice.js');

assert.deepStrictEqual(
  next.normalizeQueueItem({ expressionId: 'e001', mode: 'weird', reason: 'x' }),
  { expressionId: 'e001', mode: 'review', reason: 'x' }
);

const unlockedBank = [
  { id: 'e001', coreVerbId: 'v_get', nounIds: ['n_time'] },
  { id: 'e002', coreVerbId: 'v_get', nounIds: ['n_help'] },
  { id: 'e010', coreVerbId: 'v_need', nounIds: ['n_time'] },
];

const watch = next.watchlistPracticeItems([
  { status: 'watchlist', entityType: 'expression', entityId: 'e001' },
  { status: 'watchlist', entityType: 'verb', entityId: 'v_get' },
  { status: 'watchlist', entityType: 'expression', entityId: 'locked_expr' },
  { status: 'confirmed', entityType: 'expression', entityId: 'e010' },
], unlockedBank);
assert.ok(watch.some(item => item.expressionId === 'e001'));
assert.ok(watch.some(item => item.reason === 'vault-watchlist-verb'));
assert.ok(!watch.some(item => item.expressionId === 'locked_expr'));

const vaultQueue = next.buildQueue({
  importedNextPractice: {
    source: 'vault',
    queue: [
      { expressionId: 'e010', mode: 'matrix', reason: 'vault' },
      { expressionId: 'locked', mode: 'review', reason: 'vault' },
    ],
  },
  unlockedIds: ['e001', 'e002', 'e010'],
  unlockedBank,
  openGaps: [{ expressionId: 'e001', mode: 'koen' }],
});
assert.strictEqual(vaultQueue[0].expressionId, 'e010');
assert.strictEqual(vaultQueue.length, 1);

const localQueue = next.buildQueue({
  openGaps: [{ expressionId: 'e001', mode: 'matrix' }],
  watchlistLinks: [{ status: 'watchlist', entityType: 'expression', entityId: 'e002' }],
  importedBrainState: { weakSlots: [{ expressionId: 'e010', reason: 'output-low' }] },
  weakReview: [{ expressionId: 'e001', reason: 'weak-link' }],
  unlockedIds: ['e001', 'e002', 'e010'],
  unlockedBank,
});
assert.deepStrictEqual(localQueue.map(item => item.expressionId), ['e001', 'e002', 'e010']);
assert.strictEqual(localQueue[0].reason, 'open-gap');
assert.strictEqual(next.softHintBoost('e010', { weakSlots: [{ expressionId: 'e010' }] }), 1);
assert.strictEqual(next.softHintBoost('e001', { weakSlots: [{ expressionId: 'e010' }] }), 0);

console.log('✅ next-practice tests passed');
