#!/usr/bin/env node
/**
 * Unit test: forced retrieval prefers empty output; home seed uses weak-axis picker.
 */
const assert = require('assert');
const path = require('path');
const NextPractice = require(path.join(__dirname, '../../src/domain/next-practice.js'));

const bank = [
  { id: 'strong' },
  { id: 'weak-output' },
  { id: 'mid' },
];
const historyById = {
  strong: {
    reviewPriority: 1,
    connections: {
      recognition: { strength: 1 },
      assembly: { strength: 1 },
      output: { strength: 1 },
    },
  },
  mid: {
    reviewPriority: 4,
    connections: {
      recognition: { strength: 1 },
      assembly: { strength: 0.5 },
      output: { strength: 0.5 },
    },
  },
  'weak-output': {
    reviewPriority: 3,
    connections: {
      recognition: { strength: 1 },
      assembly: { strength: 1 },
      output: { strength: 0 },
    },
  },
};

const items = NextPractice.weakConnectionItems(bank, historyById, { limit: 3 });
assert.strictEqual(items[0].expressionId, 'weak-output', 'forced retrieval prefers empty output');
assert.strictEqual(items[0].mode, 'speak');
assert.ok(!items.some(item => item.expressionId === 'strong'));

const seed = NextPractice.pickWeakAxisSeed(bank, historyById, {
  dateKey: '2026-07-22',
  excludeIds: ['strong'],
});
assert.strictEqual(seed.id, 'weak-output');

console.log('✅ daily quest weak-speak pick tests passed');