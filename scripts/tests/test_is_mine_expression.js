#!/usr/bin/env node
/**
 * Unit test: isMineExpression pedagogy — prefer 3-axis strong;
 * fallback needs output strength (attempts alone do not count).
 */
const assert = require('assert');

function allStrongHistory(history) {
  return ['recognition', 'assembly', 'output'].every(key => (history.connections?.[key]?.strength || 0) === 1);
}

function isMineExpression(history, successes, threshold = 3) {
  if (allStrongHistory(history)) return true;
  if ((successes || 0) < threshold) return false;
  return (history.connections?.output?.strength || 0) > 0;
}

assert.strictEqual(isMineExpression({
  connections: {
    recognition: { strength: 1 },
    assembly: { strength: 1 },
    output: { strength: 1 },
  },
}, 0), true, 'all-strong is mine');

assert.strictEqual(isMineExpression({
  connections: {
    recognition: { strength: 1 },
    assembly: { strength: 0 },
    output: { strength: 0 },
  },
}, 5), false, 'MCQ-heavy success without output is not mine');

assert.strictEqual(isMineExpression({
  connections: {
    recognition: { strength: 1 },
    assembly: { strength: 1 },
    output: { strength: 0, attempts: 1 },
  },
}, 3), false, 'threshold + output attempts alone is not mine');

assert.strictEqual(isMineExpression({
  connections: {
    recognition: { strength: 0 },
    assembly: { strength: 0 },
    output: { strength: 1 },
  },
}, 3), true, 'threshold + output strength counts');

assert.strictEqual(isMineExpression({ connections: {} }, 2), false);

console.log('✅ isMineExpression output-strength gate tests passed');
