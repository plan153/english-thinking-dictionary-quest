#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Contrast = require(path.join(__dirname, '../../src/domain/expression-contrast.js'));

const curated = Contrast.normalizeContrast({
  koVerb: '실수하다',
  enEngine: 'make',
  enNoun: 'a mistake',
  tip: '한국어는 동사 하나, 영어는 기본동사+명사.',
  wrongDirectTranslation: 'do a mistake',
});
assert.strictEqual(curated.assembly, 'make + a mistake');
assert.ok(Contrast.contrastSummaryLine(curated).includes('실수하다'));
assert.ok(Contrast.contrastSummaryLine(curated).includes('make + a mistake'));
assert.ok(Contrast.contrastTeachingLines(curated).some(line => line.includes('직역 주의')));

const derived = Contrast.deriveContrast(
  {
    id: 'e_test',
    naturalKorean: '질문이 있어요.',
    coreVerbId: 'v_have',
    patternId: 'p_have_thing',
    nounIds: ['n_question'],
  },
  {
    verbs: [{ id: 'v_have', word: 'have' }],
    nouns: [{ id: 'n_question', word: 'question' }],
    patterns: [{ id: 'p_have_thing', label: 'have + noun' }],
  }
);
assert.ok(derived);
assert.strictEqual(derived.enEngine, 'have');
assert.strictEqual(derived.source, 'derived');

const resolved = Contrast.resolveContrast({
  contrast: { koVerb: '쉬다', enEngine: 'get', enNoun: 'rest' },
});
assert.strictEqual(resolved.assembly, 'get + rest');

const expressions = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/expressions.json'), 'utf8'));
const mistake = expressions.find(item => item.id === 'e032');
assert.ok(mistake?.contrast, 'e032 should carry curated contrast');
assert.strictEqual(mistake.contrast.enEngine, 'make');
assert.match(mistake.contrast.wrongDirectTranslation || '', /do a mistake/i);

const withContrast = expressions.filter(item => item.contrast).length;
assert.ok(withContrast >= 20, `expected seeded contrasts, got ${withContrast}`);

const maps = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/verb-maps.json'), 'utf8'));
const comboWithContrast = maps
  .flatMap(verb => verb.routes || [])
  .flatMap(route => (route.patterns || []).flatMap(pattern => pattern.combinations || [])
    .concat(route.combinations || [])
    .concat((route.specialCases || []).flatMap(sc => sc.combinations || [])))
  .find(combo => combo.koreanContrast);
assert.ok(comboWithContrast, 'verb-maps should expose koreanContrast on combinations');

const quiz = Contrast.buildAssembleQuiz(mistake, {
  bank: expressions.slice(0, 20),
  collections: {
    verbs: JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/verbs.json'), 'utf8')),
    nouns: JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/nouns.json'), 'utf8')),
    patterns: JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/patterns.json'), 'utf8')),
  },
});
assert.ok(quiz, 'assemble quiz should build for curated contrast cards');
assert.strictEqual(quiz.correctEngine, 'make');
assert.ok(quiz.engineChoices.includes('make'));
assert.ok(quiz.nounChoices.some(choice => /mistake/i.test(choice)));
assert.ok(Contrast.canAssemble(mistake));

console.log('✅ expression-contrast tests passed');
