#!/usr/bin/env node
/**
 * Unit test: daily quest step-7 prefers weak output / high review priority.
 */
const assert = require('assert');

function pickWeakSpeakId(bank, historyById, earlyIds = new Set()) {
  const weakPick = [...bank]
    .map(item => {
      const history = historyById[item.id] || { connections: {} };
      const outputStrength = history.connections?.output?.strength || 0;
      const emptyPieces = ['recognition', 'assembly', 'output']
        .filter(key => (history.connections?.[key]?.strength || 0) === 0).length;
      const priority = history.reviewPriority || 0;
      let score = priority * 10 + emptyPieces * 3;
      if (outputStrength < 1) score += 12;
      if (outputStrength === 0) score += 6;
      if (!earlyIds.has(item.id)) score += 2;
      return { id: item.id, score };
    })
    .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
  return weakPick[0]?.id || null;
}

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

assert.strictEqual(
  pickWeakSpeakId(bank, historyById, new Set(['strong', 'mid'])),
  'weak-output',
  'step-7 prefers empty output over already-strong items'
);

console.log('✅ daily quest weak-speak pick tests passed');
