#!/usr/bin/env node
const assert = require('assert');
const next = require('../../src/domain/next-practice.js');

assert.deepStrictEqual(
  next.normalizeQueueItem({ expressionId: 'e001', mode: 'weird', reason: 'x' }),
  { expressionId: 'e001', mode: 'review', reason: 'x', axis: '' }
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
  historyByExpressionId: {
    e001: { connections: { recognition: { strength: 1 }, assembly: { strength: 1 }, output: { strength: 1 } } },
    e002: { connections: { recognition: { strength: 1 }, assembly: { strength: 1 }, output: { strength: 0 } } },
    e010: { connections: { recognition: { strength: 0 }, assembly: { strength: 0 }, output: { strength: 0 } } },
  },
});
assert.deepStrictEqual(localQueue.map(item => item.expressionId), ['e001', 'e010', 'e002']);
assert.strictEqual(localQueue[0].reason, 'open-gap');
assert.strictEqual(localQueue[1].mode, 'speak');
assert.strictEqual(localQueue[1].reason, 'axis-output');
assert.strictEqual(localQueue[2].mode, 'speak');
assert.strictEqual(localQueue[2].reason, 'axis-output');
assert.strictEqual(next.softHintBoost('e010', { weakSlots: [{ expressionId: 'e010' }] }), 1);
assert.strictEqual(next.softHintBoost('e001', { weakSlots: [{ expressionId: 'e010' }] }), 0);

assert.strictEqual(next.modeForAxis('output'), 'speak');
assert.strictEqual(next.modeForAxis('recognition'), 'listen');
assert.strictEqual(next.modeForAxis('assembly'), 'koen');
assert.strictEqual(
  next.weakestIncompleteAxis({
    connections: {
      recognition: { strength: 1 },
      assembly: { strength: 1 },
      output: { strength: 0 },
    },
  }),
  'output'
);
assert.strictEqual(
  next.weakestIncompleteAxis({
    connections: {
      recognition: { strength: 0 },
      assembly: { strength: 0 },
      output: { strength: 0 },
    },
  }),
  'output',
  'prefer output when every axis is empty'
);

const history = {
  e001: {
    connections: {
      recognition: { strength: 1 },
      assembly: { strength: 1 },
      output: { strength: 1 },
    },
  },
  e002: {
    reviewPriority: 2,
    connections: {
      recognition: { strength: 1 },
      assembly: { strength: 1 },
      output: { strength: 0 },
    },
  },
  e010: {
    reviewPriority: 1,
    connections: {
      recognition: { strength: 0.5 },
      assembly: { strength: 0 },
      output: { strength: 0.5 },
    },
  },
};
const axisItems = next.weakConnectionItems(unlockedBank, history, { limit: 5 });
assert.strictEqual(axisItems[0].expressionId, 'e002');
assert.strictEqual(axisItems[0].mode, 'speak');
assert.ok(axisItems.every(item => item.expressionId !== 'e001'), 'all-strong excluded');

const seed = next.pickWeakAxisSeed(unlockedBank, history, { dateKey: '2026-07-25' });
assert.ok(seed && (seed.id === 'e002' || seed.id === 'e010'));
assert.notStrictEqual(seed.id, 'e001');

const forcedQueue = next.buildQueue({
  unlockedIds: ['e001', 'e002', 'e010'],
  unlockedBank,
  historyByExpressionId: history,
  openGaps: [],
  watchlistLinks: [],
  weakReview: [],
});
assert.ok(forcedQueue.length >= 1);
assert.strictEqual(forcedQueue[0].expressionId, 'e002');
assert.strictEqual(forcedQueue[0].mode, 'speak');

console.log('✅ next-practice tests passed');
