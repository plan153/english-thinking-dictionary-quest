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

const whatItIs = QaMatrixGenerate.fromExpression({
  id: 'e137',
  english: 'It is what it is.',
  naturalKorean: '어쩔 수 없지. / 이미 이렇게 된걸 어떡해.',
  coreVerbId: 'v_be',
});
assert.strictEqual(whatItIs.forms.find(f => f.id === 'question').en, 'Is that just how it is?');
assert.ok(!/Does it is/i.test(whatItIs.forms.find(f => f.id === 'question').en));
assert.ok(!/doesn't is/i.test(whatItIs.forms.find(f => f.id === 'negative').en));

const imFine = QaMatrixGenerate.fromExpression({
  id: 'e105',
  english: "I'm fine.",
  naturalKorean: '괜찮아요.',
  coreVerbId: 'v_be',
});
assert.strictEqual(imFine.forms.find(f => f.id === 'question').en, 'Are you fine?');
assert.strictEqual(imFine.forms.find(f => f.id === 'negative').en, "I'm not fine.");
assert.strictEqual(imFine.forms.find(f => f.id === 'shortYes').en, 'Yes, I am.');

const itsOkay = QaMatrixGenerate.fromExpression({
  id: 'e140',
  english: "It's okay.",
  naturalKorean: '괜찮아요.',
  coreVerbId: 'v_be',
});
assert.strictEqual(itsOkay.forms.find(f => f.id === 'question').en, 'Is it okay?');
assert.strictEqual(itsOkay.forms.find(f => f.id === 'negative').en, "It isn't okay.");

const thatsFine = QaMatrixGenerate.fromExpression({
  id: 'e139',
  english: "That's fine.",
  naturalKorean: '괜찮아요.',
  coreVerbId: 'v_be',
});
assert.strictEqual(thatsFine.forms.find(f => f.id === 'question').en, 'Is that fine?');

const onWay = QaMatrixGenerate.fromExpression({
  id: 'e008',
  english: "I'm on my way.",
  naturalKorean: '가는 중이에요.',
  coreVerbId: 'v_be',
});
assert.strictEqual(onWay.forms.find(f => f.id === 'question').en, 'Are you on your way?');
assert.strictEqual(onWay.forms.find(f => f.id === 'negative').en, "I'm not on my way.");

const howAreYou = QaMatrixGenerate.fromExpression({
  id: 'e153',
  english: 'How are you?',
  naturalKorean: '어떻게 지내세요?',
  coreVerbId: 'v_be',
});
assert.strictEqual(howAreYou.forms.find(f => f.id === 'question').en, 'How are you?');
assert.ok(!/^I don't How/i.test(howAreYou.forms.find(f => f.id === 'negative').en));
assert.strictEqual(howAreYou.forms.find(f => f.id === 'statement').en, "I'm fine.");

const illDo = QaMatrixGenerate.fromExpression({
  id: 'e050',
  english: "I'll do it.",
  naturalKorean: '제가 할게요.',
  coreVerbId: 'v_do',
});
assert.strictEqual(illDo.forms.find(f => f.id === 'question').en, 'Will you do it?');
assert.strictEqual(illDo.forms.find(f => f.id === 'negative').en, "I won't do it.");

const ensured = QaMatrixGenerate.ensureMatrix(
  { id: 'e021', english: 'I have an idea.', naturalKorean: '생각이 있어요.', coreVerbId: 'v_have' },
  [{ id: 'm_have_idea', baseExpressionId: 'e021', forms: [] }]
);
assert.strictEqual(ensured.id, 'm_have_idea');

console.log('✅ qa-matrix-generate tests passed');
