#!/usr/bin/env node
const assert = require('assert');
const feynman = require('../../src/domain/feynman-challenge.js');

const lexicon = feynman.buildAllowedLexicon({
  verbs: [{ id: 'v_have', word: 'have' }, { id: 'v_need', word: 'need' }],
  nouns: [{ id: 'n_time', word: 'time' }, { id: 'n_help', word: 'help' }],
  expressions: [
    { id: 'e001', coreVerbId: 'v_have', nounIds: ['n_time'], english: 'I have time.', chunks: ['have', 'time'] },
    { id: 'e002', coreVerbId: 'v_need', nounIds: ['n_help'], english: 'I need help.', chunks: ['need', 'help'] },
  ],
  unlockedExpressionIds: ['e001'],
});

assert.ok(lexicon.has('have'));
assert.ok(lexicon.has('time'));
assert.ok(lexicon.has('the'));
assert.ok(!lexicon.has('need'), 'locked expression words stay out');

const passed = feynman.evaluateExplanation('I have some time for you', lexicon);
assert.strictEqual(passed.status, 'passed');
assert.strictEqual(passed.blocked.length, 0);

const blocked = feynman.evaluateExplanation('I need quantum help now', lexicon);
assert.ok(blocked.blocked.includes('quantum'));
assert.ok(blocked.blocked.includes('need') || blocked.blocked.includes('now') || blocked.status === 'blocked');

const id = feynman.makeExplanationId({ expressionId: 'e001', createdAt: '2026-07-22T00:00:00Z', text: 'I have time' });
assert.ok(id.startsWith('exp_e001_'));

console.log('✅ feynman-challenge tests passed');
