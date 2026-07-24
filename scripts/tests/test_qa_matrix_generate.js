#!/usr/bin/env node
'use strict';

const assert = require('assert');
const QaMatrixGenerate = require('../../src/domain/qa-matrix-generate.js');

const take = QaMatrixGenerate.fromExpression({
  id: 'e006',
  english: 'Take your time.',
  naturalKorean: '천천히 하세요.',
  coreVerbId: 'v_take',
});
assert.ok(take);
assert.strictEqual(take.forms.find(f => f.id === 'question').en, 'Can I take my time?');

const idea = QaMatrixGenerate.fromExpression({
  id: 'e021',
  english: 'I have an idea.',
  naturalKorean: '생각이 있어요.',
  coreVerbId: 'v_have',
});
assert.strictEqual(idea.forms.find(f => f.id === 'question').en, 'Do you have an idea?');
assert.strictEqual(idea.forms.find(f => f.id === 'statement').en, 'I have an idea.');

const minute = QaMatrixGenerate.fromExpression({
  id: 'e091',
  english: 'Do you have a minute?',
  naturalKorean: '잠깐 시간 있어요?',
  coreVerbId: 'v_have',
});
assert.strictEqual(minute.forms.find(f => f.id === 'question').en, 'Do you have a minute?');
assert.ok(/I have a minute/i.test(minute.forms.find(f => f.id === 'statement').en));

const tired = QaMatrixGenerate.fromExpression({
  id: 'e004',
  english: "I'm getting tired.",
  naturalKorean: '점점 피곤해지고 있어요.',
  coreVerbId: 'v_get',
});
assert.strictEqual(tired.forms.find(f => f.id === 'question').en, 'Are you getting tired?');

const water = QaMatrixGenerate.fromExpression({
  id: 'e025',
  english: 'Have some water.',
  naturalKorean: '물 좀 마셔요.',
  coreVerbId: 'v_have',
});
assert.strictEqual(water.forms.find(f => f.id === 'question').en, 'Do you want some water?');

const lunch = QaMatrixGenerate.fromExpression({
  id: 'e024',
  english: "Let's have lunch.",
  naturalKorean: '점심 먹어요.',
  coreVerbId: 'v_have',
});
assert.strictEqual(lunch.forms.find(f => f.id === 'question').en, 'Should we have lunch?');

const noGet = QaMatrixGenerate.fromExpression({
  id: 'e026',
  english: "I don't get it.",
  naturalKorean: '이해가 안 돼요.',
  coreVerbId: 'v_get',
});
assert.strictEqual(noGet.forms.find(f => f.id === 'question').en, 'Do you get it?');

const noTime = QaMatrixGenerate.fromExpression({
  id: 'e062',
  english: 'I have no time.',
  naturalKorean: '시간이 없어요.',
  coreVerbId: 'v_have',
});
assert.strictEqual(noTime.forms.find(f => f.id === 'question').en, 'Do you have time?');

const coffee = QaMatrixGenerate.fromExpression({
  id: 'e098',
  english: 'Can I get coffee?',
  naturalKorean: '커피 받을 수 있어요?',
  coreVerbId: 'v_get',
});
assert.strictEqual(coffee.forms.find(f => f.id === 'statement').en, 'I can get coffee.');
assert.ok(/can't/i.test(coffee.forms.find(f => f.id === 'negative').en));

const ensured = QaMatrixGenerate.ensureMatrix(
  { id: 'e021', english: 'I have an idea.', naturalKorean: '생각이 있어요.', coreVerbId: 'v_have' },
  [{ id: 'm_have_idea', baseExpressionId: 'e021', forms: [] }]
);
assert.strictEqual(ensured.id, 'm_have_idea');

console.log('✅ qa-matrix-generate tests passed');
