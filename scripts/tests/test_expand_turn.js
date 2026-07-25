#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const ExpandTurn = require(path.join(__dirname, '../../src/domain/expand-turn.js'));

const choices = [
  { id: 'listen' },
  { id: 'shadow' },
  { id: 'ask' },
  { id: 'answer' },
  { id: 'continue' },
  { id: 'topic' },
];

assert.strictEqual(ExpandTurn.isQuestionLike("That's it."), false);
assert.strictEqual(ExpandTurn.isQuestionLike('Is that it?'), true);
assert.strictEqual(ExpandTurn.isQuestionLike("That's it.", '그게 다예요. / 됐어?'), true);

assert.strictEqual(
  ExpandTurn.resolveExpandTurn({ en: "That's it.", ko: '그게 다예요.' }),
  'statement'
);
assert.strictEqual(
  ExpandTurn.resolveExpandTurn({ en: 'Is that it?', ko: '그게 다예요?' }),
  'question'
);
assert.strictEqual(
  ExpandTurn.resolveExpandTurn({ formId: 'question', en: "That's it." }),
  'question'
);
assert.strictEqual(
  ExpandTurn.resolveExpandTurn({
    expressionId: 'e1',
    lastExpressionId: 'e1',
    lastExpandChoiceId: 'ask',
    en: "That's it.",
  }),
  'question'
);
assert.strictEqual(
  ExpandTurn.resolveExpandTurn({
    expressionId: 'e2',
    lastExpressionId: 'e1',
    lastExpandChoiceId: 'ask',
    en: "That's it.",
  }),
  'statement'
);

assert.strictEqual(ExpandTurn.formSwapLabel('statement'), '의문문으로');
assert.strictEqual(ExpandTurn.formSwapLabel('question'), '평서문으로');

const fromStatement = ExpandTurn.filterExpandChoices(choices, 'statement').map(c => c.id);
assert.deepStrictEqual(fromStatement, ['shadow', 'ask', 'continue', 'topic']);
const fromQuestion = ExpandTurn.filterExpandChoices(choices, 'question').map(c => c.id);
assert.deepStrictEqual(fromQuestion, ['shadow', 'answer', 'continue', 'topic']);

assert.strictEqual(ExpandTurn.correctExpandChoiceId('ask', 'question'), 'answer');
assert.strictEqual(ExpandTurn.correctExpandChoiceId('answer', 'statement'), 'ask');
assert.strictEqual(ExpandTurn.correctExpandChoiceId('ask', 'statement'), 'ask');

console.log('✅ expand-turn tests passed');
